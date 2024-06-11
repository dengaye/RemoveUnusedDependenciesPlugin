//index.js
// require('./c.js');
const add = require('lodash/add')
import "./styles/index.css"
const anime = require('animejs');
function fn() {
  console.log('index-------', add(1, 4));
  anime({
    targets: 'div',
    translateX: 250,
    rotate: '1turn',
    backgroundColor: '#FFF',
    duration: 800
  });
}
fn();