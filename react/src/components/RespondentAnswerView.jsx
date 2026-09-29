import PropTypes from 'prop-types';
export default function RespondentAnswerView({ question, index, answer }) {
   let values = [];
   if (question.type === 'checkboxes' && answer != null && answer !== '') {
      try { const parsed = Array.isArray(answer) ? answer : JSON.parse(answer); values = Array.isArray(parsed) ? parsed : [answer]; }
      catch { values = [answer]; }
   } else if (answer != null && answer !== '') {
      values = [answer];
   }
   const typeLabels = { 'short answer': 'Short answer', paragraph: 'Long answer', dropdown: 'Selected option', 'multiple choice': 'Selected option', checkboxes: 'Selected options' };
   return <article className="answer-card">
      <div className="answer-question-heading"><span className="answer-number">{String(index + 1).padStart(2, '0')}</span><div><span className="answer-type">{typeLabels[question.type] || 'Answer'}</span><h3>{question.question}</h3>{question.description && <p>{question.description}</p>}</div></div>
      {!values.length ? <p className="answer-not-provided">No answer provided</p> : question.type === 'checkboxes' ? <ul className="answer-selections">{values.map((value, i) => <li key={i}><span aria-hidden="true">✓</span>{String(value)}</li>)}</ul> : <div className="answer-text">{String(values[0])}</div>}
   </article>;
}
RespondentAnswerView.propTypes = {
   question: PropTypes.object,
   index: PropTypes.number,
   answer: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
};
