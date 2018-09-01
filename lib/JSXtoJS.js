// JSX => Juact.h function calls
export default function JSXtoJS(type = "div", props, ...children) {
  props = props || {};
  props.children = [].concat.apply([], children); // flatten
  
  return { type, props };
}