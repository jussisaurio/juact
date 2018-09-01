import Juact from "./Juact";

/* CUSTOM EXAMPLE CODE NOT RELATED TO THE FRAMEWORK */
class App extends Juact.Component {
  constructor(props) {
    super(props);
    this.state = { items: props.items };
  }

  componentDidMount() {
    console.log("Main component did mount", this);
    setInterval(() => {
      if (Math.random() > 0.5 && this.state.items.length > 1) {
        const [_, ...items] = this.state.items;
        this.setState({ items });
      } else {
        const item = { id: Math.random().toString() };
        this.setState({ items: [...this.state.items, item ]});
      }
    }, 500);
  }

  render() {
    return window.tree = (
      <div>
        <Header title="Super Juact App" />
        <ul id="main-list">
          { this.state.items.map(item => <li id={`list-item-${item.id}`} >{ item.id }</li>) }
        </ul>
        { Math.random() > 0.5 && <Header title="Footer" /> }
      </div>
    );
  }
}

const headerStyle = { color: "tomato", "font-family": "Verdana" };

class Header extends Juact.Component {
  constructor(props) {
    super(props);

    this.state = { exclamationMarks: 3 };
  }

  componentDidMount() {
    console.log("Header component did mount", this);
    setInterval(() => {
      let excl = this.state.exclamationMarks - 1;
      if (!excl) excl = 4;
      this.setState({ exclamationMarks: excl });
    }, 1000);
  }

  render() {
    return (
      <h1
        onClick={() => alert("wubbrks")}
        class="header"
        style={headerStyle}
      >
        { this.props.title + "!".repeat(this.state.exclamationMarks) }
      </h1>
    );
  }
}

const items = [{ id: "foo" }, { id: "bar" }];

Juact.render(document.querySelector("#main"), <App items={items} />)