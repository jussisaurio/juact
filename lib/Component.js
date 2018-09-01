// Base component class
export default class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  componentDidMount() {
    console.log("mounting", this);
  }
  componentDidUpdate(oldState) {
    console.log("updated", this);
  }
  componentWillUnmount() {
    console.log("unmounting", this);
  }

  setState(newState) {
    Component._renderQueue.set(this, newState);
  }

  static dispatchEvent(e) {
    e.currentTarget.events[event.type](e);
  }
}

Component._renderQueue = new Map();