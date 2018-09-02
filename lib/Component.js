// Base component class
export default class Component {
  constructor(props) {
    this.props = props;
    this.state = {};
  }

  componentDidMount() {
    console.log("mounting", this);
  }
  componentDidUpdate(oldProps, oldState) {
    console.log(this);
    console.log("oldProps", oldProps);
    console.log("oldState", oldState);
  }
  componentWillUnmount() {
    console.log("unmounting", this);
  }

  shouldComponentUpdate() {
    return true;
  }

  setState(newState) {
    Component._renderQueue.set(this, newState);
  }

  static dispatchEvent(e) {
    e.currentTarget.events[event.type](e);
  }
}

Component._renderQueue = new Map();
