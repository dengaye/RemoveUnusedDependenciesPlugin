//a.js
require('./b.js');
import "./styles/a.css"
const $ = require('jquery')
const anime = require('animejs');
function fn() {
  anime({
    targets: 'div',
    translateX: 250,
    rotate: '1turn',
    backgroundColor: '#FFF',
    duration: 800
  });
  console.log('a-------');
}
module.exports = fn();