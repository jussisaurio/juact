import DOM from "./dom";
import {
  isSameHTMLType,
  isTextNode,
  isJuactComponent,
  isValidNode,
  setProp,
  removeProp,
  hasProp,
  getKey
} from "./helpers";

const TEXT_NODE = 3;

export const jsxMap = new WeakMap();

export function patchComponent(
  el,
  node = null,
  oldNode,
  parent = el.parentNode,
  oldState = el._instance ? el._instance.state : null
) {
  // class component
  if (el._instance) {
    const oldProps = el._instance.props;

    if (node) {
      el._instance.props = node.props;
    }

    const oldVdom = jsxMap.get(el._instance);
    const newVdom = el._instance.render();
    jsxMap.set(el._instance, newVdom);

    patch(el, newVdom, oldVdom, parent);
    el._instance.componentDidUpdate(oldProps, oldState);
  }
  // functional component
  else {
    patch(el, renderComponent(node), renderComponent(oldNode), parent);
  }
}

// Resolve components (i.e. functions) into vdom node objects
export function renderComponent(node) {
  if (typeof node.type === "function") {
    // class component
    if (isJuactComponent(node.type)) {
      const instance = new node.type(node.props);
      jsxMap.set(instance, instance.render());
      return renderComponent(Object.assign(jsxMap.get(instance), { instance }));
    }
    // functional component
    return renderComponent(node.type(node.props));
  }

  return node != null ? node : "";
}

// Create actual DOM nodes from virtual nodes
export function createElement(node) {
  const el = isTextNode(node)
    ? document.createTextNode(node)
    : document.createElement(node.type);

  if (el.nodeType !== TEXT_NODE) {
    updateElement(el, { props: {} }, node);

    node.props.children.forEach(c => {
      c = renderComponent(c);
      const childEl = createElement(c);
      DOM.mount(el, childEl);
    });
  }

  if (node.instance) {
    el._instance = node.instance;
    node.instance._el = el;
  }

  return el;
}

// Update element attributes via props (also incl. event handlers etc)
export function updateElement(element, oldNode, newNode) {
  const props = Object.assign({}, oldNode.props, newNode.props);
  const keys = Object.keys(props);

  for (const prop of keys) {
    if (prop === "children") continue;

    // Event handlers
    if (prop.startsWith("on")) {
      const event = prop.slice(2).toLowerCase();
      if (!element.events) {
        element.events = {};
      }
      if (typeof newNode.props[prop] === "function") {
        if (!element.events[event])
          element.addEventListener(event, DOM.dispatchEvent);
        element.events[event] = newNode.props[prop];
      } else {
        element.removeEventListener(event, DOM.dispatchEvent);
      }
    }

    // Style objects
    else if (prop === "style") {
      const style = newNode.props[prop];
      const oldStyle = oldNode.props[prop];
      for (const [key, value] of Object.entries(style)) {
        if (!oldStyle || oldStyle[key] !== value) element.style[key] = value;
      }
    }

    // Other properties
    else {
      if (hasProp(oldNode, prop) && !hasProp(newNode, prop)) {
        removeProp(element, prop, props[prop]);
      } else if (oldNode.props[prop] != newNode.props[prop]) {
        setProp(element, prop, props[prop]);
      }
    }
  }
}

// Perform diffing of old and new virtual trees, and patch the DOM as minimally as possible
export function patch(el, node, oldNode, parent = el.parentNode) {
  // Old node exists, new one doesnt => unmount
  if (isValidNode(oldNode) && !isValidNode(node)) {
    if (el) DOM.unmount(parent, el);
    return;
  }

  // New node exists, old node doesn't => create and mount/replace
  if (!isValidNode(oldNode) && isValidNode(node)) {
    const newEl = createElement(renderComponent(node));
    if (!el) {
      DOM.mount(parent, newEl);
      return;
    }
    DOM.replace(parent, newEl, el);
    return;
  }

  // New node is text node. Unless exactly the same as the old node, create and replace old with new.
  if (isTextNode(node)) {
    if (node != oldNode) {
      const newEl = createElement(node);
      DOM.replace(parent, newEl, el);
    }
    return;
  }

  // New node is a component (functional or class)
  if (typeof node.type === "function") {
    if (
      !el._instance ||
      el._instance.shouldComponentUpdate(node.props, el._instance.state)
    ) {
      patchComponent(el, node, oldNode, parent);
    }
    return;
  }

  // Node is a vnode, but the type has changed (e.g. "div" -> "span")
  // Assume the trees are different and replace the whole subtree
  if (!isSameHTMLType(el, node)) {
    const newEl = createElement(node);
    DOM.replace(parent, newEl, el);
    return newEl;
  }

  // Node is a vnode and the type is the same. Compare props and update element attributes/event handlers etc.
  updateElement(el, oldNode, node);

  // Handle diffing of children using 'key' prop.
  const children = node.props.children;
  const oldChildren = oldNode.props.children;
  const oldElements = [].slice.call(el.childNodes);
  const newKeyed = {};
  const oldKeyed = oldChildren.filter(c => getKey(c) != null).reduce(
    (acc, child, i) =>
      Object.assign(acc, {
        [child.key]: { el: oldElements[i], node: child }
      }),
    {}
  );

  let i = 0; // Iteration through OLD child elements
  let k = 0; // Iteration through NEW child elements

  /* Children that, in the new vdom, should be above the old child, are moved into its current position,
   * and consequently the old child is pushed 1 position down. When a position is reached where the current
   * new child === old child, OR the new child is supposed to be directly below the old, nothing is done.
   * The newKeyed object tracks children that have already been moved, so they can be skipped later.
   * Basically each i++ means "skip", and each k++ means "child was moved to proper position"
  */
  while (k < children.length) {
    const oldKey = getKey(oldChildren[i]); // key of element that used to be in this spot
    const newKey = getKey(children[k]); // key of element that should be in this spot

    // We already know this particular item has been moved, so skip to the next.
    if (newKeyed[oldKey]) {
      i++;
      continue;
    }

    // New keyed element is already in the right place (directly under current, i)
    if (newKey != null && newKey === getKey(oldChildren[i + 1])) {
      if (oldKey == null) {
        DOM.unmount(el, oldElements[i]);
      }
      i++;
      continue;
    }

    // If both keys are undefined then just proceed with patching in "natural order"
    if (newKey == null) {
      if (oldKey == null) {
        patch(oldElements[i], children[k], oldChildren[i], el);
        k++;
      }
      i++;
    } else {
      // Get the node that should be moved (if it exists)
      const keyedNode = oldKeyed[newKey] || {};

      // Keyed node is in the exact right spot now. Merely patch its changes (props, its own children...)
      if (oldKey === newKey) {
        patch(keyedNode.el, children[k], keyedNode.node, el);
        i++;
      }
      // If the keyed element existed before, move it from its old location into the position of the
      // current "old child", pushing it 1 spot down.
      else if (keyedNode.el) {
        patch(
          el.insertBefore(keyedNode.el, oldElements[i]),
          children[k],
          keyedNode.node,
          el
        );
      }
      // A keyed element didn't exist before in this position, so just create it and replace whatever's there
      else {
        patch(oldElements[i], children[k], null, el);
      }

      // Mark the current key as already having been handled
      newKeyed[newKey] = children[k];
      k++;
    }
  }

  // At this point if there are still uniterated, unkeyed old children, they should be removed
  while (i < oldChildren.length) {
    if (getKey(oldChildren[i]) == null) {
      DOM.unmount(el, oldElements[i]);
    }
    i++;
  }

  // If there are keyed children that dont exist anymore, remove them as well
  Object.keys(oldKeyed)
    .filter(key => !newKeyed[key])
    .forEach(key => {
      DOM.unmount(el, oldKeyed[key].el);
    });
}
