// DOM Elements
const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');

// Event Listener: Add Button
addBtn.addEventListener('click', addTodo);

// Add To-Do Function
function addTodo() {
  const task = todoInput.value.trim();
  if (task === '') {
    alert('Please enter a task!');
    return;
  }

  // Create List Item
  const li = document.createElement('li');
  li.textContent = task;

  // Delete Button
  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Delete';
  deleteBtn.className = 'delete-btn';
  deleteBtn.addEventListener('click', () => li.remove());

  // Append Delete Button to List Item
  li.appendChild(deleteBtn);

  // Append List Item to Todo List
  todoList.appendChild(li);

  // Clear Input
  todoInput.value = '';
}