import React, { Component } from 'react';
import Main from './Main';
import TodoList from '../abis/TodoList.json'
import './App.css';
import Web3 from 'web3';

class App extends Component {
  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    }
    else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    }
    else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }

  }

  async loadBlockchainData() {
    const web3 = window.web3
    // Load account
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    // Network ID
    const networkId = await web3.eth.net.getId();
    const networkData = TodoList.networks[networkId]
    if (networkData) {
      const todoList = new web3.eth.Contract(TodoList.abi, networkData.address);
      //console.log(todoList);
      this.setState({ todoList })
      const taskCount = await todoList.methods.taskCount().call();
      //console.log(taskCount.toNumber());
      this.setState({ taskCount: taskCount.toNumber() });

      for (var i = 1; i <= taskCount; i++) {
        const task = await todoList.methods.tasks(i).call()
        this.setState({
          taskData: [...this.state.taskData, task]
        });
      }

      this.setState({ loading: false });
    } else {
      window.alert('ToDoList contract not deployed to detected network.')
    }

  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      taskCount: 0,
      taskData: [],
      loading: true
    }
    this.createTask = this.createTask.bind(this);
    this.toggleCompleted = this.toggleCompleted.bind(this);
  }

  createTask(content) {
    this.setState({ loading: true });
    this.state.todoList.methods.createTask(content).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })

  }

  toggleCompleted(taskId) {
    this.setState({ loading: true })
    this.state.todoList.methods.toggleCompleted(taskId).send({ from: this.state.account })
      .once('receipt', (receipt) => {
        this.setState({ loading: false })
      })
  }

  render() {
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a className="navbar-brand col-sm-3 col-md-2 mr-0" href="#" target="_blank">Krishnas | Todo List</a>
          <ul className="navbar-nav px-3">
            <li className="nav-item text-nowrap d-none d-sm-none d-sm-block">
              <small><a className="nav-link" href="#">{this.state.account}</a></small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex justify-content-center">
              {this.state.loading
                ? <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
                : <Main tasks={this.state.taskData} createTask={this.createTask} toggleCompleted={this.toggleCompleted} />
              }
            </main>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
