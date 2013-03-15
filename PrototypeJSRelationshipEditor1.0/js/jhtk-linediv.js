/*
 * Josh's Javascript Toolkit
 * Line drawing using DIVs, v.1.0
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

jhtkLine = {
	makeLineWithDiv : function(inDiv, inX1, inY1, inX2, inY2)
	{
		distX = inX2 - inX1;
		distY = inY1 - inY2;
		angle = Math.atan2( distX, distY );
		distY = Math.abs(distY);
		distX = Math.abs(distX);
		len = Math.round(Math.sqrt( distX * distX + distY * distY ));
		
		inDiv.style.position = 'absolute';
		inDiv.style.height = len + 'px';
		inDiv.style.webkitTransform = 'rotate('+angle+'rad)';
		inDiv.style.MozTransform = 'rotate('+angle+'rad)';
		inDiv.style.msTransform = 'rotate('+angle+'rad)';// not tested
		inDiv.style.oTransform = 'rotate('+angle+'rad)';// not tested
		inDiv.style.left = Math.min(inX1, inX2) + (distX / 2) + 'px';
		inDiv.style.top = Math.min(inY1, inY2) + (distY / 2) - (len / 2) + 'px';
	}
};


