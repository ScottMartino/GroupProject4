import axios from "axios"
/* import useContext and AppContext Component to useStates on the context component */
import { useContext, useEffect, useState } from "react";
import { AppContext } from "./AppContextProvider";

const Form = () => {

  const [syllableError, setSyllableError] = useState(false);
  const [noMatchError, setNoMatchError] = useState(false);
  /* const the state and  method we need */
  const {
    userInput, setUserInput,
    userError, setUserError,
    syllableLineOne, setSyllableLineOne,
    lineOne, setLineOne,
    followingWords, setFollowingWords,
    completedHaiku, setCompletedHaiku,
    queryUserInput, setQueryUserInput,
  } = useContext(AppContext);

  const handleInputChange = e => {
    // const regEx = /[a-z]/g
    const regEx = /[\d\s.~!@#$%^&*()_+={}[\];',<>-]/g
    if (regEx.test(e.target.value)) {
      /* this means statement has number, special characters we do not want */
      setUserError(true);
    } else {
      /* reset userError display when corrected */
      setUserError(false);
      setUserInput(e.target.value);

    }
    // console.log(regEx.test(e.target.value))
  }

  const handleClear = () => {
    setSyllableLineOne(5);
    setLineOne('');
    setUserInput('');
    setQueryUserInput('');
  }

  /* to display completed Haiku once each line is made */
  useEffect(() => {
    const completedLine = [...lineOne];
    setCompletedHaiku(completedLine);
  }, [lineOne, setCompletedHaiku])

  const handleOnClick = word => {
    // console.log('you clicked ', word.word);
    const syllableCount = word.numSyllables;

    setSyllableLineOne(syllableLineOne - syllableCount);
    // console.log(setSyllableLineOne);
    const currentLine = `${lineOne} ${word.word}`
    setLineOne(currentLine);
    // setUserInput(word.word);
    setQueryUserInput(word.word);
  }

  const handleInputSubmit = (event) => {
    event.preventDefault();
    /* set the userInput into queryUserInput to make axios call because queryUserInput is the useEffect dependency */
    setQueryUserInput(userInput);

    /* for resetting input */
    event.target[0].value = ('');

    /* queryUserInput for syllable */
    axios({
      url: 'http://api.datamuse.com/words',
      method: 'GET',
      params: {
        sp: userInput,
        md: 's, p',
        max: 1
      }
    }).then((response) => {
      if (response.data[0] === undefined) {
        setNoMatchError(true);
      } else {
        setNoMatchError(false);
        const syllableCount = response.data[0].numSyllables;

        if ((syllableLineOne - syllableCount) < 0) {
          setSyllableError(true);
        } else {
          setSyllableLineOne(syllableLineOne - syllableCount);
          const currentLine = lineOne + ' ' + userInput;
          setLineOne(currentLine);
          setSyllableError(false);
        }
      }
    })
  }

  /* for following words */
  useEffect(() => {
    // console.log('useEffect running')
    // console.log('userINput: ', userInput)
    axios({
      url: 'http://api.datamuse.com/words',
      method: 'GET',
      params: {
        rel_jja: queryUserInput,
        rel_bga: queryUserInput,
        md: 's, p',
        max: 20
      }
    }).then((response) => {
      /* to filter out words that only meets syllable count limit */
      setFollowingWords(
        response.data.filter((word) =>
          word.numSyllables <= syllableLineOne
        )
      )
    })
    /* dependency of userInput is basically making autocomplete */
  }, [lineOne, queryUserInput, setFollowingWords, syllableLineOne])


  return (

    <div>
      <h3>Syllables Left: {syllableLineOne}</h3>
      <h3>{lineOne}</h3>

      <ul>
        {
          (followingWords.length === 0 && lineOne.length > 0 && syllableLineOne > 0) ? <h2>no commonly following words exist</h2> :
            null
        }
        {
          followingWords.map((word, index) => {
            return (
              <li key={`followingWords-${index}`}>
                <button onClick={() => handleOnClick(word)}>
                  {word.numSyllables} {word.word}
                </button>
              </li>
            )
          })
        }
      </ul>

      <h2>
        {syllableLineOne === 0 ? completedHaiku : null}
      </h2>

      <form name="input" onSubmit={handleInputSubmit}>
        <label htmlFor="input">Enter first word of Haiku:  </label>
        {
          (userError) ?
            <h2>no numbers or special chars</h2> :
            null
        }
        {
          (syllableError) ?
            <h2>too many syllables</h2> :
            null
        }
        {
          (noMatchError) ?
            <h2>word does not exist</h2> :
            null
        }
        <input type="text" id="input" name="input" placeholder="eg. Plant" onChange={handleInputChange} required></input>
        <button type="submit">Submit</button>
      </form>
      <button onClick={handleClear}>Clear</button>
    </div>
  )
}

export default Form