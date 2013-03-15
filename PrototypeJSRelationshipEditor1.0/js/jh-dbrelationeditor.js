/*
 * Josh's Database Relationship Editor, v.1.0
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

/*
	TODO

	*	Replace the line code in each relationship with a call to the line code in jhtkLine.
	*	Tidy up
	*	Make change tracking more efficient
	
*/

function jhDbReEntity(inEntityDesc)
{
	this._data = inEntityDesc;
	this._domNode = null;
	this._relations = new Array();
	this.dirty = false;
	
	this._handleMoved = function(e)
	{
		this._data.x = this._domNode.offsetLeft;
		this._data.y = this._domNode.offsetTop;
		rels = this._relations;
		for (i = rels.length-1; i >= 0; i--)
		{
			rels[i].redraw();
		}
		this.dirty = true;
		jhDbRelationEditor._handlerChanged();
	};
	
	this._handleRemove = function()
	{
		this._data.visible = false;
		this._domNode.style.visibility = 'hidden';
		for (i = this._relations.length-1; i >= 0; i--)
			this._relations[i].hide();
		this.dirty = true;
		jhDbRelationEditor._handlerChanged();
	};
	
	this.show = function()
	{
		this._data.visible = true;
		this._domNode.style.visibility = 'visible';
		for (i = this._relations.length-1; i >= 0; i--)
			this._relations[i].showIfPairVisible();
		this.dirty = true;
	};
	
	this._init = function()
	{
		node = this._domNode = document.createElement('div');
		node.className = 'jh-dbre-entity jhtk-moveable';
		node.style.position = 'absolute';
		node.style.width = 'auto';
		node.style.left = this._data.x+'px';
		node.style.top = this._data.y+'px';
		node.innerHTML = '<header class="jhtk-draggable"><h1>'+this._data.name+'</h1><div class="jh-dbre-close-button">x</div></header><ul></ul>';
		
		attListNode = node.children[1];
		attDescs = this._data.attributes;
		attDescCount = attDescs.length;
		for (a = 0; a < attDescCount; a++)
		{
			attDesc = attDescs[a];
			attListNode.innerHTML += '<li class="jh-dbre-entity-att'+((attDesc.key==true)?' key':'')+'" style="display:block;">'+attDesc.name+'</li>';
		}

	 	
		jhDbRelationEditor._containerNode.appendChild(node);
		
		node.addEventListener('jhtkMoved', this._handleMoved.bind(this), false);
		node.children[0].children[1].addEventListener('click', this._handleRemove.bind(this), false);
		
		if (!this._data.visible)
			node.style.visibility = 'hidden';
	};
	
	this.getAttributeNamed = function(inName)
	{
		atts = this._data.attributes;
		for (i = atts.length-1; i >= 0; i--)
			if (atts[i].name == inName) return i;
		return -1;
	};
	
	this.unlink = function(inRel)
	{
		for (i = this._relations.length-1; i >= 0; i--)
		{
			if (this._relations[i] == inRel)
			{
				this._relations.splice(i, 1);
				return;
			}
		}
	};

	this._init();
}




function jhDbReRelation(inRelationDesc)
{
	this._data = inRelationDesc;
	this._domNode = null;
	this._domNodeStroke1 = null;
	this._domNodeStroke2 = null;
	this._entity1 = null;
	this._attribute1 = null;
	this._entity2 = null;
	this._attribute2 = null;
	
	this.dirty = false;
	
	this._id = 0;
	
	this.STROKE_SIZE = 10;
	
	this.hide = function()
	{
		this._domNodeStroke1.style.visibility = 'hidden';
		this._domNodeStroke2.style.visibility = 'hidden';
		this._domNode.style.visibility = 'hidden';
	}
	
	this.showIfPairVisible = function()
	{
		if ((!this._entity1._data.visible) || (!this._entity2._data.visible))
		{
			//alert('hidden');
			//if (this._domNode.style.visibility == 'visible')
			this.hide();
			return;
		}
		this._domNode.style.visibility = 'visible';
		this._domNodeStroke1.style.visibility = 'visible';
		this._domNodeStroke2.style.visibility = 'visible';
	}
	
	this.redraw = function()
	{
		node = this._domNode;
		entity1 = this._entity1._domNode;
		entity2 = this._entity2._domNode;
		
		// determine the relative orientation of the entities 
		if (entity1.offsetLeft + entity1.offsetWidth < entity2.offsetLeft)
			orient = 0; // left
		else if (entity2.offsetLeft + entity2.offsetWidth < entity1.offsetLeft)
			orient = 1; // right
		else
		{
			// determine if there is a greater delta between left sides or right sides for
			// centre oriented entities, thus determining which side to place the relation line
			//window.status = 'centre';
			if (Math.abs(entity1.offsetLeft - entity2.offsetLeft) < 
					Math.abs((entity1.offsetLeft + entity1.offsetWidth) - 
						(entity2.offsetLeft + entity2.offsetWidth)))
				orient = 2; // centre left
			else
				orient = 3; // centre right
		}
		
		switch (orient)
		{
		case 0: // left
			distX = entity2.offsetLeft - this.STROKE_SIZE - 
				(entity1.offsetLeft + entity1.offsetWidth + this.STROKE_SIZE);
			break;
		case 1: // right
			distX = entity1.offsetLeft - this.STROKE_SIZE - 
				(entity2.offsetLeft + entity2.offsetWidth + this.STROKE_SIZE);
			break;
		case 2: // centre left
			distX = Math.abs(entity2.offsetLeft - entity1.offsetLeft);
			break;
		case 3: // centre right
			distX = -1 * Math.abs((entity2.offsetLeft + entity2.offsetWidth) - 
				(entity1.offsetLeft + entity1.offsetWidth));
			break;
		}
	
		/*attY1 = entity1.offsetTop + jhDbRelationEditor._attributeHeight + 5 + 
			(jhDbRelationEditor._attributeHeight * this._attribute1);
		attY2 = entity2.offsetTop + jhDbRelationEditor._attributeHeight + 5 + 
			(jhDbRelationEditor._attributeHeight * this._attribute2);*/
			
		attY1 = entity1.offsetTop + jhDbRelationEditor._attributeOffset + 
			(jhDbRelationEditor._attributeHeight * this._attribute1) 
			- (jhDbRelationEditor._attributeHeight/2);
		attY2 = entity2.offsetTop + jhDbRelationEditor._attributeOffset + 
			(jhDbRelationEditor._attributeHeight * this._attribute2)
			- (jhDbRelationEditor._attributeHeight/2);

		switch (orient)
		{
		case 0: // left
			distY = attY1 - attY2;
			break;
		case 1:
			distY = attY2 - attY1;
			break;
		case 2:
			distY = attY1 - attY2;
			break;
		case 3:
			distY = attY1 - attY2;
			break;
		}
		
		angle = Math.atan2( distX, distY );
		
		distY = Math.abs(distY);
		len = Math.sqrt( distX * distX + distY * distY );
		node.style.height = len + 'px';
		
		node.style.webkitTransform = 'rotate('+angle+'rad)';
		node.style.MozTransform = 'rotate('+angle+'rad)';
		node.style.msTransform = 'rotate('+angle+'rad)';// not tested
		node.style.oTransform = 'rotate('+angle+'rad)';// not tested

		switch (orient)
		{
		case 0: // left
			node.style.left = entity1.offsetLeft + entity1.offsetWidth + (distX / 2) + 
				this.STROKE_SIZE - 4 + 'px';
			break;
		case 1: // right
			node.style.left = entity2.offsetLeft + entity2.offsetWidth + (distX / 2) + 
				this.STROKE_SIZE - 4 + 'px';
			break;
		case 2: // centre left
			node.style.left = entity1.offsetLeft + (distX / 2) - this.STROKE_SIZE - 4 + 'px';
			break;
		case 3: // centre right
			node.style.left = entity1.offsetLeft + entity1.offsetWidth + (distX / 2) + 
				this.STROKE_SIZE - 4 + 'px';
			break;
		}
		
		node.style.top = jhDbRelationEditor._attributeHeight + Math.min(attY1,attY2) + 
			(distY / 2) - (len / 2) + 'px';
			
			
		// position the strokes
		
		switch (orient)
		{
		case 0:
			this._domNodeStroke2.style.left = entity1.offsetLeft + entity1.offsetWidth - 4 + 'px';
			this._domNodeStroke2.style.top = jhDbRelationEditor._attributeHeight + attY1 - 2 + 'px';
			this._domNodeStroke1.style.left = entity2.offsetLeft - this.STROKE_SIZE - 4 + 'px';
			this._domNodeStroke1.style.top = jhDbRelationEditor._attributeHeight + attY2 - 1 + 'px';
			break;
		case 1:
			this._domNodeStroke1.style.left = entity2.offsetLeft + entity2.offsetWidth - 4 + 'px';
			this._domNodeStroke1.style.top = jhDbRelationEditor._attributeHeight + attY2 - 1 + 'px';
			this._domNodeStroke2.style.left = entity1.offsetLeft - this.STROKE_SIZE - 4 + 'px';
			this._domNodeStroke2.style.top = jhDbRelationEditor._attributeHeight + attY1 - 2 + 'px';
			break;
		case 2:
			this._domNodeStroke1.style.left = entity2.offsetLeft - this.STROKE_SIZE - 4 + 'px';
			this._domNodeStroke1.style.top = jhDbRelationEditor._attributeHeight + attY2 - 1 + 'px';
			this._domNodeStroke2.style.left = entity1.offsetLeft - this.STROKE_SIZE - 4 + 'px';
			this._domNodeStroke2.style.top = jhDbRelationEditor._attributeHeight + attY1 - 2 + 'px';
			break;
		case 3:
			this._domNodeStroke1.style.left = entity2.offsetLeft + entity2.offsetWidth - 4 + 'px';
			this._domNodeStroke1.style.top = jhDbRelationEditor._attributeHeight + attY2 - 1 + 'px';
			this._domNodeStroke2.style.left = entity1.offsetLeft + entity1.offsetWidth - 4 + 'px';
			this._domNodeStroke2.style.top = jhDbRelationEditor._attributeHeight + attY1 - 2 + 'px';
			break;
		}
		
	}
	
	this._handleEdit = function()
	{
		copyOfDetail = {
			entity1 	: this._data.entity1,
			attribute1 	: this._data.attribute1,
			entity2 	: this._data.entity2,
			attribute2 	: this._data.attribute2,
			enforceIntegrity: this._data.enforceIntegrity,
			cascadeUpdate : this._data.cascadeUpdate,
			deleteOption: this._data.deleteOption
			};
		jhDbRelationEditor._handlerEditRel(this._id, copyOfDetail);
	}
	
	this.unlink = function()
	{
		this._entity1.unlink(this);
		this._entity2.unlink(this);
		
		jhDbRelationEditor._containerNode.removeChild(this._domNode);
		jhDbRelationEditor._containerNode.removeChild(this._domNodeStroke1);
		jhDbRelationEditor._containerNode.removeChild(this._domNodeStroke2);
	}
	
	this._updateCardinality = function()
	{
		this._domNodeStroke2.innerHTML = '<div style="width:100%;height:'+((this._data.enforceIntegrity)?'3':'1')+'px;position:absolute;left: 4px; top: 0; background-color:black;"></div>';
	}
	
	this.update = function(inDetail)
	{
		// need to copy relevant values here
		this._data.enforceIntegrity= inDetail.enforceIntegrity;
		this._data.cascadeUpdate = inDetail.cascadeUpdate;
		this._data.deleteOption= inDetail.deleteOption;

		// then make display changes as required
		this._updateCardinality();
		
		this.dirty = true;
	};
	
	this._init = function()
	{
		this._id = ++jhDbRelationEditor._relationIdSeq;
		
		this._entity1 = jhDbRelationEditor._getEntityNamed(this._data.entity1);
		this._attribute1 = this._entity1.getAttributeNamed(this._data.attribute1);
		this._entity2 = jhDbRelationEditor._getEntityNamed(this._data.entity2);
		this._attribute2 = this._entity2.getAttributeNamed(this._data.attribute2);
		
		this._entity1._relations.push(this);
		this._entity2._relations.push(this);
	
		node1 = this._domNode = document.createElement('div');
		node1.className = 'jh-dbre-relation';
		node1.style.position = 'absolute';
		node1.innerHTML = '<div style="width:1px;height:100%;position:absolute;left: 4px; top: 0; background-color:black;"></div>';
		node1.style.width = '8px';
		
		node2 = this._domNodeStroke1 = document.createElement('div');
		node2.className = 'jh-dbre-relation';
		node2.style.position = 'absolute';
		node2.style.width = this.STROKE_SIZE+'px';
		node2.innerHTML = '<div style="width:100%;height:1px;position:absolute;left: 4px; top: 0; background-color:black;"></div>';
		node2.style.height = 8+'px';
		
		node3 = this._domNodeStroke2 = document.createElement('div');
		node3.className = 'jh-dbre-relation';
		node3.style.position = 'absolute';
		node3.style.width = this.STROKE_SIZE+'px';
		node3.style.height = 8+'px';
		this._updateCardinality();
		
		this.redraw();
		
		jhDbRelationEditor._containerNode.appendChild(node1);
		jhDbRelationEditor._containerNode.appendChild(node2);
		jhDbRelationEditor._containerNode.appendChild(node3);
		
		node1.addEventListener('click', this._handleEdit.bind(this), false);
		node2.addEventListener('click', this._handleEdit.bind(this), false);
		node3.addEventListener('click', this._handleEdit.bind(this), false);
		
		this.showIfPairVisible();
	};

	this._init();
}




jhDbRelationEditor = {

	_attributeHeight : 0,
	_attributeOffset : 0,
	
	_entities : new Array(),
	_relations : new Array(),
	_draggingLine : null,
	_containerNode : null,
	
	_relationIdSeq : 0,
	
	_inited : false,
	_deletedRelNames : new Array(),
	
	
	_handlerAdd : null,
	_handlerChanged : null,
	_handlerEditRel : null, // pass an integer ID and the detail as a data structure;
							// results of edit if performed should be acknowledged with a call
							// providing the same integer ID to identify which relationship
							// is actually being modified

	_measureLayoutPrimitives : function()
	{
		largeNode = document.createElement('div');
		largeNode.style.visibility = 'hidden';
		largeNode.className = 'jh-dbre-entity';
		largeNode.innerHTML = '<header><h1>Dummy</h1></header><ul><li>Item1</li><li>Item2</li></ul>';
		jhDbRelationEditor._containerNode.appendChild(largeNode);
		
		smallNode = document.createElement('div');
		smallNode.style.visibility = 'hidden';
		smallNode.className = 'jh-dbre-entity';
		smallNode.innerHTML = '<header><h1>Dummy</h1></header><ul><li>Item1</li></ul>';
		jhDbRelationEditor._containerNode.appendChild(smallNode);
		
		jhDbRelationEditor._attributeHeight = largeNode.offsetHeight - smallNode.offsetHeight;
		jhDbRelationEditor._attributeOffset = largeNode.children[1].children[0].offsetTop;

		jhDbRelationEditor._containerNode.removeChild(largeNode);
		jhDbRelationEditor._containerNode.removeChild(smallNode);
	},
	
	_createDraggingLine : function()
	{
		node = jhDbRelationEditor._draggingLine = document.createElement('div');
		node.style.visibility = 'hidden';
		node.style.position = 'absolute';
		node.style.width = '1px';
		node.style.backgroundColor = '#000000';
		jhDbRelationEditor._containerNode.appendChild(node);
	},
	
	_handleAdd : function(e)
	{
		inEvent = e || window.event;
		if (inEvent.target == jhDbRelationEditor._containerNode)
			jhDbRelationEditor._handlerAdd();
	},
	
	_getEntityNamed : function(inName)
	{
		_entities = jhDbRelationEditor._entities;
		for (i = _entities.length-1; i >= 0; i--)
			if (_entities[i]._data.name == inName) return _entities[i];
		return null;
	},
	
	start : function(inContainerName, inAddHandler, inChangeHandler, inEditRelHandler)
	{
		if (jhDbRelationEditor.containerNode != null)
		{
			alert('jh-dbrelationeditor.start() can only be called once in this version (ie.'+
				' you can only have one relation editor at a time.)  This restriction may '+
				'be lifted in future.');
			return;
		}
		containerNode = document.getElementById(inContainerName);
		if ((!containerNode) || (containerNode.nodeName != 'DIV'))
		{
			alert('jh-dbrelationeditor.start() must be passed the name of a container DIV element.');
			return;
		}
		jhDbRelationEditor._containerNode = containerNode;
		jhDbRelationEditor._measureLayoutPrimitives();
		jhDbRelationEditor._createDraggingLine();
		document.addEventListener('click', jhDbRelationEditor._handleAdd, false);
		jhDbRelationEditor._handlerAdd = inAddHandler;
		jhDbRelationEditor._handlerChanged = inChangeHandler;
		jhDbRelationEditor._handlerEditRel = inEditRelHandler;
	},
	
	defineEntity : function(inEntityDesc)
	{
		jhDbRelationEditor._entities.push( new jhDbReEntity(inEntityDesc) );
	},
	
	defineRelation : function(inRelationDesc)
	{
		newrel = new jhDbReRelation(inRelationDesc);
		if (jhDbRelationEditor._inited) newrel.dirty = true;
		jhDbRelationEditor._relations.push( newrel );
		return jhDbRelationEditor._relationIdSeq;
	},
	
	getHiddenEntities : function()
	{
		listOfNames = new Array();
		ents = jhDbRelationEditor._entities;
		c = ents.length;
		for (i = 0; i < c; i++)
		{
			if (ents[i]._data.visible == false)
				listOfNames.push(ents[i]._data.name);
		}
		return listOfNames;
	},
	
	showEntity : function(inName)
	{
		ents = jhDbRelationEditor._entities;
		c = ents.length;
		for (i = 0; i < c; i++)
		{
			if (ents[i]._data.name == inName)
			{
				ents[i].show();
				jhDbRelationEditor._handlerChanged();
				return;
			}
		}
	},
	
	deleteRelation : function(inID)
	{
		rels = jhDbRelationEditor._relations;
		c = rels.length;
		for (i = 0; i < c; i++)
		{
			if (rels[i]._id == inID)
			{
				if (rels[i]._data.name != '')
					jhDbRelationEditor._deletedRelNames.push(rels[i]._data.name);
				rels[i].unlink();
				jhDbRelationEditor._relations.splice(i,1);
				
				jhDbRelationEditor._handlerChanged();
				return;
			}
		}
	},
	
	updateRelation : function(inID, inDetail)
	{
		rels = jhDbRelationEditor._relations;
		c = rels.length;
		for (i = 0; i < c; i++)
		{
			if (rels[i]._id == inID)
			{
				rels[i].update(inDetail);
				
				jhDbRelationEditor._handlerChanged();
				return;
			}
		}
	},
	
	getChanges : function()
	{
		result = new Array();
		
		ents = jhDbRelationEditor._entities;
		c = ents.length;
		for (i = 0; i < c; i++)
		{
			ent = ents[i];
			if (!ent.dirty) continue;
			ent.dirty = false;
			result.push({
				type: 'entity',
				name: ent._data.name,
				x: ent._data.x,
				y: ent._data.y,
				visible: ent._data.visible
				});
		}
		
		rels = jhDbRelationEditor._relations;
		c = rels.length;
		for (i = 0; i < c; i++)
		{
			rel = rels[i];
			if (!rel.dirty) continue;
			rel.dirty = false;
			if (rel._data.name == '')
			{
				d = new Date();
				rel._data.name = 'rel_'+rel._id+'_'+d.getTime();
			}
			result.push({
				type: 'relation',
				name: rel._data.name,
				entity1: rel._data.entity1,
				attribute1: rel._data.attribute1,
				entity2: rel._data.entity2,
				attribute2: rel._data.attribute2,
				enforceIntegrity: rel._data.enforceIntegrity,
				cascadeUpdate: rel._data.cascadeUpdate,
				deleteOption: rel._data.deleteOption
				});
		}
		
		rels = jhDbRelationEditor._deletedRelNames;
		c = rels.length;
		for (i = 0; i < c; i++)
		{
			result.push({
				type: 'relation',
				name: rels[i],
				delete: true
				});
		}
		jhDbRelationEditor._deletedRelNames = new Array();
		
		return result;
	},
	
	
	
	_lookupNamesForAttributeDiv : function(inAttDiv)
	{
		// returns an array: [ namedEntity, namedAttribute ]
		attName = inAttDiv.innerHTML;
		entName = inAttDiv.parentNode.parentNode.children[0].children[0].innerHTML;
		return [entName, attName];
	},
	
	_targetAtt : null,
	_startX : 0,
	_startY : 0,
		
	_beginDrag : function(e)
	{
		inEvent = e || window.event;
		if (jhtkDraggable._isClass(inEvent.target, 'jh-dbre-entity-att'))
		{
			jhDbRelationEditor._targetAtt = inEvent.target;
			jhDbRelationEditor._startX = inEvent.clientX - jhDbRelationEditor._containerNode.offsetLeft 
				+ jhDbRelationEditor._containerNode.scrollLeft;
			jhDbRelationEditor._startY = inEvent.clientY - jhDbRelationEditor._containerNode.offsetTop
				+ jhDbRelationEditor._containerNode.scrollTop;
			
			jhtkLine.makeLineWithDiv(jhDbRelationEditor._draggingLine, 
				inEvent.clientX, inEvent.clientY, inEvent.clientX, inEvent.clientY);
			jhDbRelationEditor._draggingLine.style.visibility = 'visible';
			
			inEvent.preventDefault();
		}
	},	
	
	_endDrag : function(e)
	{
		if (jhDbRelationEditor._targetAtt != null)
		{
			inEvent = e || window.event;
			
			if (jhtkDraggable._isClass(inEvent.target, 'jh-dbre-entity-att'))
			{
				goingFrom = jhDbRelationEditor._lookupNamesForAttributeDiv(jhDbRelationEditor._targetAtt);
				goingTo = jhDbRelationEditor._lookupNamesForAttributeDiv(inEvent.target);
				
				jhDbRelationEditor._inited = true;
				relid = jhDbRelationEditor.defineRelation({
					name: '',
					entity1: goingFrom[0], 
					attribute1: goingFrom[1], 
					entity2: goingTo[0], 
					attribute2: goingTo[1],
					enforceIntegrity: false,
					cascadeUpdate: false,
					deleteOption: 'restrict'
					});
				
				//jhDbRelationEditor._newRelIDs.push(relid);
				jhDbRelationEditor._handlerChanged();
			}
			
			jhDbRelationEditor._draggingLine.style.visibility = 'hidden';
			jhDbRelationEditor._targetAtt = null;
		}
	},
	
	_continueDrag : function(e)
	{
		if (jhDbRelationEditor._targetAtt == null) return;
		
		inEvent = e || window.event;
		
		jhtkLine.makeLineWithDiv(jhDbRelationEditor._draggingLine, 
				jhDbRelationEditor._startX, jhDbRelationEditor._startY, 
				inEvent.clientX - jhDbRelationEditor._containerNode.offsetLeft
					+ jhDbRelationEditor._containerNode.scrollLeft, 
				inEvent.clientY - jhDbRelationEditor._containerNode.offsetTop
					+ jhDbRelationEditor._containerNode.scrollTop);
	},
};

document.addEventListener('mousedown', jhDbRelationEditor._beginDrag, false);
document.addEventListener('mouseup', jhDbRelationEditor._endDrag, false);
document.addEventListener('mousemove', jhDbRelationEditor._continueDrag, false);



