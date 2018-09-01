import { createElement, patch } from "./vdom";
import dom from "./dom";
import { isJuactComponent } from "./helpers";


export function renderComponent(node, parent) {
  if (isJuactComponent(node.type)) {
    const instance = new node.type(node.props);
    instance._el = createElement(instance.render(), parent);
    instance._el._instance = instance;
    instance.componentDidMount();
    return instance._el;
  }

  return createElement(node.type(node.props), parent);
}

export function patchComponent(el, node, parent = el.parentNode) {
  if (el._instance) {
    el._instance.props = node ? node.props : el._instance.props;
    return patch(el, el._instance.render(), parent);
  }

  if (isJuactComponent(node.type)) {
    const newEl = renderComponent(node, parent);
    if (parent) {
      dom.replace(parent, newEl, el);
      return newEl;
    }

    return newEl;
  }

  return patch(el, node.type(node.props), parent);
}