// Taken and modified from some random guy"s sample app: https://codepen.io/codebeast/pen/PzVyRm?editors=1010
// Testing Juact as a drop-in replacement for React
import Juact from "./Juact";
import todos from "./todos.json";

class Title extends Juact.Component {
  constructor(props) {
    super(props);
    this.state = { visible: true };
  }
  componentDidMount() {}
  render() {
    return (
      <div>
        <div>
          {this.state.visible && (
            <h1>Juact Todo App ({this.props.todoCount})</h1>
          )}
        </div>
      </div>
    );
  }
}

const TodoForm = ({ addTodo }) => {
  // Input Tracker
  const handleAdd = e => {
    e.preventDefault();
    addTodo(e.target[0].value);
    e.target[0].value = "";
  };
  // Return JSX
  return (
    <form onSubmit={handleAdd}>
      <input className="form-control col-md-12" />
      <br />
    </form>
  );
};

class Todo extends Juact.Component {
  constructor(props) {
    super(props);
    this.state = {
      taskAge: 0
    };
  }
  componentDidMount() {
    console.log("mount todo item", this);
    this._interval = setInterval(
      () => this.setState({ taskAge: this.state.taskAge + 2 }),
      2000
    );
  }
  componentWillUnmount() {
    clearInterval(this._interval);
    console.log("unmount todo item", this);
  }
  render() {
    const { todo, remove, uppercase } = this.props;
    const { taskAge } = this.state;
    const text = `${todo.text} (${taskAge} seconds old task)`;
    return (
      <div
        className="list-group-item"
        onClick={() => remove(todo.id)}
        style={{ cursor: "pointer" }}
      >
        {uppercase ? text.toUpperCase() : text}
      </div>
    );
  }
}

const TodoList = ({ todos, remove, uppercase }) => {
  // Map through the todos
  const todoNode = todos.map(todo => (
    <Todo uppercase={uppercase} todo={todo} key={todo.id} remove={remove} />
  ));
  return (
    <div className="list-group" style={{ marginTop: "30px" }}>
      {todoNode}
    </div>
  );
};

// Container Component
class TodoApp extends Juact.Component {
  constructor(props) {
    // Pass props to parent class
    super(props);
    // Set initial state
    this.state = {
      data: JSON.parse(JSON.stringify(todos)).slice(0, 4),
      uppercase: false
    };

    this.shuffle = this.shuffle.bind(this);
  }

  componentDidMount() {
    console.log("Todo app mounted");
    // setInterval(
    //   () => this.setState({ uppercase: !this.state.uppercase }),
    //   3000
    // );
  }
  // Add todo handler
  addTodo(val) {
    // Assemble data
    const todo = {
      text: val,
      id: Math.random()
        .toString()
        .slice(2)
    };
    this.setState({ data: [...this.state.data, todo] });
  }
  // Handle remove
  handleRemove(id) {
    // Filter all todos except the one to be removed
    const remainder = this.state.data.filter(todo => todo.id !== id);
    this.setState({ data: remainder });
  }

  shuffle() {
    const data = this.state.data.slice().sort(() => Math.random() - 0.5);
    this.setState({ data });
  }

  render() {
    // Render JSX
    return (
      <div>
        <Title todoCount={this.state.data.length} />
        <TodoForm addTodo={this.addTodo.bind(this)} />
        <TodoList
          uppercase={this.state.uppercase}
          todos={this.state.data}
          remove={this.handleRemove.bind(this)}
        />
        <div className="btn btn-primary" onClick={this.shuffle}>
          Shuffle
        </div>
      </div>
    );
  }
}
Juact.render(<TodoApp />, document.querySelector("#main"));
