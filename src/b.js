//b.js
const $ = require('jquery')
import "./styles/b.css"
// const add = require('lodash/add')
const add = require('lodash/add')
function fn() {
  console.log('index-------', add(1, 4));
}
module.exports = fn();