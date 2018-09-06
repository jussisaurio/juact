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
    // console.log("updated", this);
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
}

Component._renderQueue = new Map();
