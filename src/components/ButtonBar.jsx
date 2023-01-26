import React, { useState } from 'react';

function ButtonBar() {
  const [selectedOption, setSelectedOption] = useState('option1');

  const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
  };

  return (
    <div className="button-bar">
      <div className={`button ${selectedOption === 'option1' ? 'active' : ''}`}>
        <input
          type="radio"
          name="group1"
          value="option1"
          checked={selectedOption === 'option1'}
          onChange={handleOptionChange}
        /><br/>
       🤑
      </div>
      <div className={`button ${selectedOption === 'option2' ? 'active' : ''}`}>
        <input
          type="radio"
          name="group1"
          value="option2"
          checked={selectedOption === 'option2'}
          onChange={handleOptionChange}
        /><br/>
        🤑🤑
      </div>
      <div className={`button ${selectedOption === 'option3' ? 'active' : ''}`}>
        <input
          type="radio"
          name="group1"
          value="option3"
          checked={selectedOption === 'option3'}
          onChange={handleOptionChange}
        /><br/>
        🤑🤑🤑
      </div>
      <div className={`button ${selectedOption === 'option4' ? 'active' : ''}`}>
        <input
          type="radio"
          name="group1"
          value="option4"
          checked={selectedOption === 'option4'}
          onChange={handleOptionChange}
        /><br/>
        🤑🤑🤑🤑
      </div>
    </div>
  );
}

export default ButtonBar;
