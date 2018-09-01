// Taken and modified from some random guy"s sample app: https://codepen.io/codebeast/pen/PzVyRm?editors=1010
// Testing Juact as a drop-in replacement for React
import Juact from "./Juact";
import todos from "./todos.json";

const Title = ({todoCount}) => {
  return (
    <div>
       <div>
          <h1>Juact Todo App ({todoCount})</h1>
       </div>
    </div>
  );
}

const TodoForm = ({addTodo}) => {
  // Input Tracker
  const handleAdd = (e) => {
    e.preventDefault();
    addTodo(e.target[0].value);
    e.target[0].value = "";
  }
  // Return JSX
  return (
    <form onSubmit={handleAdd}>
      <input className="form-control col-md-12" />
      <br />
    </form>
  );
};

const Todo = ({todo, remove}) => {
  return (
    <div
      className="list-group-item"
      onClick={() => remove(todo.id)}
      style={{ cursor: "pointer" }}
    >
      { todo.text }
    </div>
  );
}

const TodoList = ({todos, remove}) => {
  // Map through the todos
  const todoNode = todos.map((todo) => <Todo todo={todo} key={todo.id} remove={remove}/>);
  return <div className="list-group" style={{marginTop:"30px"}}>{todoNode}</div>;
}

// Container Component
class TodoApp extends Juact.Component{
  constructor(props){
    // Pass props to parent class
    super(props);
    // Set initial state
    this.state = {
      data: JSON.parse(JSON.stringify(todos)),
    };
  }

  componentDidMount(){
    console.log("Todo app mounted");
  }
  // Add todo handler
  addTodo(val){
    // Assemble data
    const todo = { text: val, id: Math.random().toString().slice(2) }
    this.setState({data: [...this.state.data, todo ]});
  }
  // Handle remove
  handleRemove(id){
    // Filter all todos except the one to be removed
    const remainder = this.state.data.filter(todo => todo.id !== id);
    this.setState({data: remainder });
  }
 
  render(){
    // Render JSX
    return (
      <div>
        <Title todoCount={this.state.data.length}/>
        <TodoForm addTodo={this.addTodo.bind(this)}/>
        <TodoList 
          todos={this.state.data} 
          remove={this.handleRemove.bind(this)}
        />
      </div>
    );
  }
}
Juact.render(document.getElementById("main"), <TodoApp />);