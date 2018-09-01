import Component from "./Component";

// Helpers
export const isJuactComponent = ctor => ctor && ctor.prototype && Object.getPrototypeOf(ctor.prototype) === Component.prototype;
export const setProp = (element, name, value) => name === "children" ? null : element.setAttribute(name === "className" ? "class" : name, value);
export const removeProp = (element, name) => name === "children" ? null : element.removeAttribute(name === "className" ? "class" : name);
export const isValidNode = val => val != null && typeof val !== "boolean";
export const isTextNode = val => ["number", "string"].includes(typeof val);
export const hasProp = (obj, prop) => obj.props.hasOwnProperty(prop);
export const isSameHTMLType = (el, node) => el.nodeName === node.type.toUpperCase();