import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import ThreeDot from './ThreeDot';

function GuessDate() {
    const [gameData, setGameData] = useState(null);
    const [error, setError] = useState(null);
    const [gameIds, setGameIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [guesses, setGuesses] = useState([]);
    const [guess, setGuess] = useState({ month: '', day: '', year: '' });
    const [gameDate, setGameDate] = useState(null);
    const [message, setMessage] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        const fetchGameIds = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/game-ids`);
                if (!response.ok) {
                    throw new Error('Failed to fetch game Ids');
                }
                const data = await response.json();
                setGameIds(data);
            } catch (err) {
                console.error('Error fetching game IDs:', err);
                setError('Failed to fetch game IDs');
            }
        };

        fetchGameIds();
    }, []);

    const fetchRandomGame = async () => {
        setLoading(true); // Set loading state before the fetch operation

        try {
            if (gameIds.length === 0) {
                throw new Error('No game IDs available');
            }
            const min = 0;
            const max = gameIds.length;
            const rando = Math.floor(Math.random() * (max - min) + min);
            const randomGameId = gameIds[rando];

            const boxscoreResponse = await fetch(`http://localhost:5000/api/game-boxscore/${randomGameId}`);
            if (!boxscoreResponse.ok) {
                throw new Error('Failed to fetch game boxscore');
            }
            const boxscoreData = await boxscoreResponse.json();
            setGameData(boxscoreData.boxscore);

            const date = boxscoreData.boxscore.split('\n').slice(0, -2)[boxscoreData.boxscore.split('\n').slice(0, -2).length - 1];
            if (date) {
                const dateObj = new Date(date);
                const formattedDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getDate().toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
                setGameDate(formattedDate);
                console.log('Game Date:', formattedDate);
            } else {
                setGameDate(null);
            }

            setGuesses([]); // Reset guesses
            setGuess({ month: '', day: '', year: '' }); // Clear text boxes
            setMessage(''); // Clear message
            setError(null);
        } catch (err) {
            console.error('Error fetching game data:', err);
            setError('Fetching Game Data, Try Again.');
        } finally {
            setLoading(false); // Reset loading state after the fetch operation
        }
    };

    const handleGuessChange = (e) => {
        const { name, value } = e.target;
        setGuess((prevGuess) => ({ ...prevGuess, [name]: value }));
    };

    const handleGuessSubmit = (e) => {
        e.preventDefault();
        if (guesses.length >= 5) return;

        const newGuess = `${guess.month}-${guess.day}-${guess.year}`;
        setGuesses((prevGuesses) => [...prevGuesses, newGuess]);

        if (newGuess === gameDate) {
            setMessage('Congratulations! You guessed the correct date!');
        } else if (guesses.length === 4) {
            setMessage(`Sorry, you've used all your tries. The correct date was ${gameDate}.`);
        }

        // Scroll to the bottom
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [guesses]);

    const getFeedback = (guessPart, actualPart, isDay = false) => {
        if (guessPart === actualPart) return 'correct';
        if (isDay) {
            const diff = Math.abs(guessPart - actualPart);
            if (diff <= 2) return 'very-close';
            if (diff <= 7) return 'close';
        }
        if (Math.abs(guessPart - actualPart) === 1) return 'close';
        return 'incorrect';
    };

    return (
        <div>
            <h1>Guess the Date: Random Box Score Game</h1>
            <button onClick={fetchRandomGame} className="search-button">Fetch Random Game</button>
            {loading && <ThreeDot variant="pulsate" color="#e28b3b" size="small" text="" textColor="" />}
            {error && <p className="error">{error}</p>}
            {gameData && (
                <>
                    <div className="game-box-score">
                        <pre>{gameData.split('\n').slice(0, -3).concat('**********').join('\n')}</pre>
                    </div>

                    <div className="guess-date-game">
                        <h2>Guess the Date</h2>
                        <form onSubmit={handleGuessSubmit} className="guess-form">
                            <div className="guess-inputs">
                                <input
                                    type="text"
                                    name="month"
                                    value={guess.month}
                                    onChange={handleGuessChange}
                                    placeholder="MM"
                                    maxLength="2"
                                    required
                                    autoComplete="off"
                                />
                                <input
                                    type="text"
                                    name="day"
                                    value={guess.day}
                                    onChange={handleGuessChange}
                                    placeholder="DD"
                                    maxLength="2"
                                    required
                                    autoComplete="off"
                                />
                                <input
                                    type="text"
                                    name="year"
                                    value={guess.year}
                                    onChange={handleGuessChange}
                                    placeholder="YYYY"
                                    maxLength="4"
                                    required
                                    autoComplete="off"
                                />
                            </div>
                            <button type="submit" className="search-button">Submit Guess</button>
                        </form>
                        <div className="guesses">
                            {guesses.map((g, index) => {
                                const [month, day, year] = g.split('-');
                                const [actualMonth, actualDay, actualYear] = gameDate ? gameDate.split('-') : ['', '', ''];
                                return (
                                    <div key={index} className="guess">
                                        <span className={`guess-part ${getFeedback(month, actualMonth)}`}>{month}</span>
                                        <span className={`guess-part ${getFeedback(day, actualDay, true)}`}>{day}</span>
                                        <span className={`guess-part ${getFeedback(year, actualYear)}`}>{year}</span>
                                    </div>
                                );
                            })}
                        </div>
                        {message && <p className="message">{message}</p>}
                        <div ref={bottomRef}></div>
                    </div>

                </>
            )}
        </div>
    );
}

export default GuessDate;
