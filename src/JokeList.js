import React, { Component } from 'react';
import axios from 'axios';
import Joke from './Joke';
import './JokeList.css';

class JokeList extends Component {
	static defaultProps = { numJokesToGet: 10 };

	constructor(props) {
		super(props);
		this.state = { jokes: [] };
		this.generateNewJokes = this.generateNewJokes.bind(this);
		this.vote = this.vote.bind(this);
		this.getJokes = this.getJokes.bind(this);
	}

	// Get jokes on load and update
	componentDidMount() {
		let jokes = this.state.jokes.length;
		let numToGet = this.props.numJokesToGet;
		if (jokes < numToGet) this.getJokes();
	}

	componentDidUpdate() {
		let jokes = this.state.jokes.length;
		let numToGet = this.props.numJokesToGet;
		if (jokes < numToGet) this.getJokes();
	}

	// function to get jokes
	async getJokes() {
		let j = this.state.jokes;
		let seenJokes = new Set(j.map((joke) => joke.id));
		let votes = JSON.parse(window.localStorage.getItem('jokeVotes') || '{}');
		try {
			while (j.length < this.props.numJokesToGet) {
				let res = await axios.get('https://icanhazdadjoke.com', {
					headers: { Accept: 'application/json' }
				});
				let { status, ...jokeObj } = res.data;

				if (!seenJokes.has(jokeObj.id)) {
					seenJokes.add(jokeObj.id);
					votes[jokeObj.id] = votes[jokeObj.id] || 0;
					j.push({ ...jokeObj, votes: votes[jokeObj.id] });
				} else {
					console.error('duplicate found!');
				}
			}
			this.setState({ j });
			window.localStorage.setItem('jokeVotes', JSON.stringify(votes));
		} catch (e) {
			console.log(e);
		}
	}

	/* empty joke list and then call getJokes */

	generateNewJokes() {
		this.setState((state) => ({ jokes: state.jokes.filter((j) => j.locked) }));
	}

	/* change vote for this id by delta (+1 or -1) */

	vote(id, delta) {
		let votes = JSON.parse(window.localStorage.getItem('jokeVotes'));
		votes[id] = (votes[id] || 0) + delta;
		window.localStorage.setItem('jokeVotes', JSON.stringify(votes));
		this.setState((state) => ({
			jokes: state.jokes.map((joke) => (joke.id === id ? { ...joke, votes: joke.votes + delta } : joke))
		}));
	}

	/* render: either loading... or list of sorted jokes. */

	render() {
		let sortedJokes = [ ...this.state.jokes ].sort((a, b) => b.votes - a.votes);

		return (
			<div className="JokeList">
				<button className="JokeList-getmore" onClick={this.generateNewJokes}>
					Get New Jokes
				</button>

				{sortedJokes.map((j) => <Joke text={j.joke} key={j.id} id={j.id} votes={j.votes} vote={this.vote} />)}

				{sortedJokes.length < this.props.numJokesToGet ? <h1>Loading...</h1> : null}
			</div>
		);
	}
}

export default JokeList;
