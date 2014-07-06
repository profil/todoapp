(function(window, undefined) {
	'use strict';

	window.addEventListener("load", function() {
		// Get elements needed
		var inputfield = document.getElementById("inputfield");
		var list = document.getElementById("content");
		var template = document.getElementById("task-template");
		var deleteButton = document.getElementById("delete");

		
		// Setup view for inputfield
		var inputView = new View({
			element: inputfield,
			template: null,
			events: {
				"keydown": function(ev) {
					if(this.element.value === "" || this.element.value[0] === ' ') return;
					var keyCode = ev.which || ev.keyCode;
					if(keyCode === 13) { // enter key!
						// sent it to the presenter
						var e = new CustomEvent("new-task", { detail: this.element.value});
						document.dispatchEvent(e);
					}
				}
			},
			render: function() {
				this.element.value = "";
			}
		});

		// Setup view for list
		var listView = new View({
			element: list,
			template: template,
			events: {
				"change" : function(ev) {
					var e;
					if(ev.target.checked === true) {
						e = new CustomEvent("check-task", { detail: ev.target.parentElement.id });
						document.dispatchEvent(e);
					}
					else {
						e = new CustomEvent("uncheck-task", { detail: ev.target.parentElement.id });
						document.dispatchEvent(e);
					}
				}
			},
			render: function(tasks) {
				Array.prototype.forEach.call(this.element.querySelectorAll("li"), function(elem) {
					this.element.removeChild(elem);
				}, this);


				for(var id in tasks) {
					// Ugly hack..
					var parent = document.createElement("div");
					parent.innerHTML = this.template.innerHTML;
					var element = parent.firstElementChild;
					var span = element.getElementsByClassName("text")[0];
					var checkbox = element.getElementsByTagName("input")[0];

					element.id = id;
					span.innerText = tasks[id].text;
					checkbox.checked = tasks[id].completed;
					this.element.appendChild(element);
				}

				/* <template> support is bad in safari
				var span = this.template.content.querySelector(".text");
				var checkbox = this.template.content.querySelector("input");
				var li = this.template.content.querySelector("li");
				for(var id in tasks) {
					span.textContent = tasks[id].text;
					checkbox.checked = tasks[id].completed;
					li.id = id;
					this.element.appendChild(
						document.importNode(this.template.content, true)
					);
				}
				*/
			}
		});
		
		// Setup view for delete
		var deleteView = new View({
			element: deleteButton,
			template: null,
			events: {
				"click": function(ev) {
					var e = new Event("delete-tasks");
					document.dispatchEvent(e);
				}
			},
			render: function() {
				this.element.style.visibility = "visible";
			},
			remove: function() {
				this.element.style.visibility = "hidden";
			}

		});

		// Setup model
		var model = new Model();

		// Setup presenter
		var presenter = new Presenter({
			views: {
				inputView: inputView,
				listView: listView,
				deleteView: deleteView
			},
			model: model,
			events: {
				"new-task": function(ev) {
					this.views.inputView.render();
					this.model.add(new Task(ev.detail));
				},
				"model-update": function() {
					this.views.listView.render(this.model.tasks);
				},
				"view-update": function() {
					var someChecked = false;
					for(var id in this.model.tasks) {
						if(this.model.tasks[id].completed === true) {
							someChecked = true;
							break;
						}
					}
					if(someChecked === false) {
						this.views.deleteView.remove();
					}
					else {
						this.views.deleteView.render();
					}
				},
				"check-task": function(ev) {
					this.model.tasks[ev.detail].completed = true;
					this.views.deleteView.render();
					this.model.save();
				},
				"uncheck-task": function(ev) {
					this.model.tasks[ev.detail].completed = false;

					// remove delete button if nothing is checked.
					var someChecked = false;
					for(var id in this.model.tasks) {
						if(this.model.tasks[id].completed === true) {
							someChecked = true;
							break;
						}
					}
					if(someChecked === false) {
						this.views.deleteView.remove();
					}

					this.model.save();
				},
				"delete-tasks": function(ev) {
					for(var id in this.model.tasks) {
						if(this.model.tasks[id].completed === true) {
							this.model.remove(this.model.tasks[id]);
						}
					}
					var e = new Event("view-update");
					document.dispatchEvent(e);
					//TODO: should add a save function.. this.model.save();
				}
			}
		});

	});


	var Task = function(text) {
		this.id = new Date().getTime(); // good enough..
		this.text = text;
		this.completed = false;
	};

	var Model = function() {
		if(localStorage.todo === undefined) {
			this.tasks = {};
		}
		else {
			this.tasks = JSON.parse(localStorage.todo);
		}
	};
	Model.prototype.add = function(task) {
		this.tasks[task.id] = task;

		localStorage.todo = JSON.stringify(this.tasks);

		var e = new Event("model-update");
		document.dispatchEvent(e);
	};
	Model.prototype.remove = function(task) {
		delete this.tasks[task.id];
		localStorage.todo = JSON.stringify(this.tasks);

		var e = new Event("model-update");
		document.dispatchEvent(e);
	};
	Model.prototype.save = function() {
		localStorage.todo = JSON.stringify(this.tasks);
	};


	var Presenter = function(obj) {
		this.views = obj.views;
		this.model = obj.model;

		var events = obj.events;
		for(var key in events) {
			document.addEventListener(key, events[key].bind(this));
		}

		// update on start!!
		var e;
		e = new Event("model-update");
		document.dispatchEvent(e);
		e = new Event("view-update");
		document.dispatchEvent(e);
	};


	var View = function(obj) {
		this.output = obj.output;
		this.template = obj.template;
		this.element = obj.element;
		this.render = obj.render;
		this.remove = obj.remove;

		var events = obj.events;
		for(var key in events) {
			this.element.addEventListener(key, events[key].bind(this));
		}

	};

})(window);
