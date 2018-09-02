import { isValidNode } from "./helpers";

// JSX => Juact.h function calls
export default function JSXtoJS(type = "div", props, ...children) {
  props = props || {};
  props.children = [].concat.apply([], children).filter(isValidNode); // flatten, remove undef/null/true/false

  return { type, props };
}
