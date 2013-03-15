/*
 * Josh's Javascript Toolkit
 * Drag and Drop, v.1.0
 * Copyright (c) 2013 Joshua Hawcroft <dev@joshhawcroft.com>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

jhtkDraggable = {
	startX: 0,
	startY: 0,
	dragging: null,
	targetX: 0,
	targetY: 0,
	
	_moveTarget :  function(inDeltaX, inDeltaY)
	{
		jhtkDraggable.dragging.style.left = jhtkDraggable.targetX + inDeltaX + 'px';
		jhtkDraggable.dragging.style.top = jhtkDraggable.targetY + inDeltaY + 'px';
		e = new CustomEvent(
			'jhtkMoved',
			{
				detail: null, /* object data structure */
				bubbles: true,
				cancelable: true
			}
		);
		jhtkDraggable.dragging.dispatchEvent(e);
	},
	
	_isClass : function(inElement, inClassName)
	{
		elementClasses = inElement.className.split(' ');
		for (i = elementClasses.length-1; i >= 0; i--)
		{
			if (elementClasses[i] == inClassName) return true;
		}
		return false;
	},
	
	_findTarget : function(inElement)
	{
		while (inElement != null)
		{
			if (jhtkDraggable._isClass(inElement, 'jhtk-draggable')) 
				break;
			inElement = inElement.parentNode;
		}
		while (inElement != null)
		{
			if (jhtkDraggable._isClass(inElement, 'jhtk-moveable')) 
				return inElement;
			inElement = inElement.parentNode;
		}
		return null;
	},

	beginDrag : function(e)
	{
		inEvent = e || window.event;
		jhtkDraggable.dragging = jhtkDraggable._findTarget(inEvent.target);
		if (jhtkDraggable.dragging == null) return;
		jhtkDraggable.startX = inEvent.clientX;
		jhtkDraggable.startY = inEvent.clientY;
		jhtkDraggable.targetX = jhtkDraggable.dragging.offsetLeft;
		jhtkDraggable.targetY = jhtkDraggable.dragging.offsetTop;
		inEvent.preventDefault();
	},
	
	endDrag : function(e)
	{
		inEvent = e || window.event;
		jhtkDraggable._moveTarget(inEvent.clientX - jhtkDraggable.startX,
			inEvent.clientY - jhtkDraggable.startY);
		jhtkDraggable.dragging = null;
	},
	
	continueDrag : function(e)
	{
		if (jhtkDraggable.dragging == null) return;
		inEvent = e || window.event;
		jhtkDraggable._moveTarget(inEvent.clientX - jhtkDraggable.startX,
			inEvent.clientY - jhtkDraggable.startY);
	},
};

document.addEventListener('mousedown', jhtkDraggable.beginDrag, false);
document.addEventListener('mouseup', jhtkDraggable.endDrag, false);
document.addEventListener('mousemove', jhtkDraggable.continueDrag, false);

