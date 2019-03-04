var SLDS=SLDS||{};SLDS["__internal/chunked/showcase/ui/utilities/horizontal-list/example.jsx.js"]=function(e){function l(l){for(var a,n,r=l[0],d=l[1],c=l[2],m=0,u=[];m<r.length;m++)n=r[m],i[n]&&u.push(i[n][0]),i[n]=0;for(a in d)Object.prototype.hasOwnProperty.call(d,a)&&(e[a]=d[a]);for(o&&o(l);u.length;)u.shift()();return s.push.apply(s,c||[]),t()}function t(){for(var e,l=0;l<s.length;l++){for(var t=s[l],a=!0,r=1;r<t.length;r++){var d=t[r];0!==i[d]&&(a=!1)}a&&(s.splice(l--,1),e=n(n.s=t[0]))}return e}var a={},i={121:0,4:0,5:0,11:0,12:0,17:0,26:0,32:0,35:0,38:0,40:0,45:0,48:0,49:0,53:0,54:0,57:0,60:0,62:0,64:0,65:0,70:0,72:0,73:0,78:0,84:0,85:0,88:0,89:0,95:0,98:0,99:0,105:0,106:0,107:0,108:0,109:0,110:0,114:0,117:0,118:0,129:0,137:0,141:0,143:0,144:0,145:0,150:0,153:0,154:0},s=[];function n(l){if(a[l])return a[l].exports;var t=a[l]={i:l,l:!1,exports:{}};return e[l].call(t.exports,t,t.exports,n),t.l=!0,t.exports}n.m=e,n.c=a,n.d=function(e,l,t){n.o(e,l)||Object.defineProperty(e,l,{configurable:!1,enumerable:!0,get:t})},n.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},n.n=function(e){var l=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(l,"a",l),l},n.o=function(e,l){return Object.prototype.hasOwnProperty.call(e,l)},n.p="/assets/scripts/bundle/";var r=this.webpackJsonpSLDS___internal_chunked_showcase=this.webpackJsonpSLDS___internal_chunked_showcase||[],d=r.push.bind(r);r.push=l,r=r.slice();for(var c=0;c<r.length;c++)l(r[c]);var o=d;return s.push([168,0]),t()}({0:function(e,l){e.exports=React},168:function(e,l,t){"use strict";Object.defineProperty(l,"__esModule",{value:!0}),l.examples=void 0;var a,i=t(0),s=(a=i)&&a.__esModule?a:{default:a};l.examples=[{id:"horizontal-list",label:"Default",element:s.default.createElement("ul",{className:"slds-list_horizontal"},s.default.createElement("li",null,"Horizontal List"),s.default.createElement("li",null,"List Item"),s.default.createElement("li",null,"List Item"))},{id:"horizontal-list-links",label:"Links",element:s.default.createElement("ul",{className:"slds-list_horizontal"},s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with inline level links")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-block-links",label:"Block links",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-block-links"},s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-block-links-space",label:"Block links with space",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-block-links_space"},s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links and space")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-inline-block-links",label:"Inline block links",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-inline-block-links"},s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with inline-block level links")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-inline-block-links-space",label:"Inline block links with space",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-inline-block-links_space"},s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with inline-block level links and space")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",null,s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-left",label:"Left",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_left"},s.default.createElement("li",{className:"slds-item"},"Horizontal List with dot dividers to the left"),s.default.createElement("li",{className:"slds-item"},"List Item"),s.default.createElement("li",{className:"slds-item"},"List Item"))},{id:"horizontal-list-link-left",label:"Left with link",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_left slds-has-block-links"},s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links and dot dividers")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-link-space-left",label:"Left with link space",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_left slds-has-block-links_space"},s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links and dot dividers with space")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-right",label:"Right",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_right"},s.default.createElement("li",{className:"slds-item"},"Horizontal List with dot dividers to the right"),s.default.createElement("li",{className:"slds-item"},"List Item"),s.default.createElement("li",{className:"slds-item"},"List Item"))},{id:"horizontal-list-link-right",label:"Right with link",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_right slds-has-block-links"},s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links and dot dividers")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))},{id:"horizontal-list-link-space-right",label:"Right with link space",element:s.default.createElement("ul",{className:"slds-list_horizontal slds-has-dividers_right slds-has-block-links_space"},s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"Horizontal List with block level links and dot dividers with space")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")),s.default.createElement("li",{className:"slds-item"},s.default.createElement("a",{href:"javascript:void(0);"},"List Item")))}]}});