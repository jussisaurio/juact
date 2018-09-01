import { isValidNode } from "./helpers";

// Append element to parent and call componentDidMount on Juact.Component instances
function mount(parent, element) {
  if (isValidNode(element)) parent.appendChild(element);
  return element;
}

function unmount(parent, element) {
  if (isValidNode(element)) {
    element._instance && element._instance.componentWillUnmount();
    parent.removeChild(element);
  }
  return isValidNode(element);
}

function replace(parent, element, oldElement) {
  parent.replaceChild(element, oldElement);
  return element;
}

export default {
  mount,
  unmount,
  replace,
};