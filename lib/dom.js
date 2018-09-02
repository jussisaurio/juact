import { isValidNode } from "./helpers";

// Append element to parent and call componentDidMount on Juact.Component instances
function mount(parent, element) {
  parent.appendChild(element);
  if (element._instance) element._instance.componentDidMount();
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
  if (oldElement._instance) oldElement._instance.componentWillUnmount();
  parent.replaceChild(element, oldElement);
  if (element._instance) element._instance.componentDidMount();
  return element;
}

export default {
  mount,
  unmount,
  replace
};
