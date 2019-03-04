var SLDS=SLDS||{};SLDS["__internal/chunked/showcase/ui/components/toast/base/example.jsx.js"]=function(e){function t(t){for(var l,r,i=t[0],o=t[1],c=t[2],m=0,u=[];m<i.length;m++)r=i[m],a[r]&&u.push(a[r][0]),a[r]=0;for(l in o)Object.prototype.hasOwnProperty.call(o,l)&&(e[l]=o[l]);for(d&&d(t);u.length;)u.shift()();return n.push.apply(n,c||[]),s()}function s(){for(var e,t=0;t<n.length;t++){for(var s=n[t],l=!0,i=1;i<s.length;i++){var o=s[i];0!==a[o]&&(l=!1)}l&&(n.splice(t--,1),e=r(r.s=s[0]))}return e}var l={},a={46:0,4:0,5:0,11:0,12:0,17:0,26:0,32:0,35:0,38:0,40:0,45:0,48:0,49:0,53:0,54:0,57:0,60:0,62:0,64:0,65:0,70:0,72:0,73:0,78:0,84:0,85:0,88:0,89:0,95:0,98:0,99:0,105:0,106:0,107:0,108:0,109:0,110:0,114:0,117:0,118:0,129:0,137:0,141:0,143:0,144:0,145:0,150:0,153:0,154:0},n=[];function r(t){if(l[t])return l[t].exports;var s=l[t]={i:t,l:!1,exports:{}};return e[t].call(s.exports,s,s.exports,r),s.l=!0,s.exports}r.m=e,r.c=l,r.d=function(e,t,s){r.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:s})},r.r=function(e){Object.defineProperty(e,"__esModule",{value:!0})},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="/assets/scripts/bundle/";var i=this.webpackJsonpSLDS___internal_chunked_showcase=this.webpackJsonpSLDS___internal_chunked_showcase||[],o=i.push.bind(i);i.push=t,i=i.slice();for(var c=0;c<i.length;c++)t(i[c]);var d=o;return n.push([94,0]),s()}({0:function(e,t){e.exports=React},94:function(e,t,s){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.examples=t.states=t.Toast=void 0;var l=i(s(0)),a=i(s(3)),n=s(5),r=(i(s(2)),i(s(1)));function i(e){return e&&e.__esModule?e:{default:e}}var o=function(e){var t=e.containerClassName,s=e.className,n=e.type,i=e.children;!function(e,t){var s={};for(var l in e)t.indexOf(l)>=0||Object.prototype.hasOwnProperty.call(e,l)&&(s[l]=e[l])}(e,["containerClassName","className","type","children"]);return l.default.createElement("div",{className:(0,r.default)("slds-notify_container",t)},l.default.createElement("div",{className:(0,r.default)("slds-notify slds-notify_toast",s,n?"slds-theme_"+n:null),role:"alert"},l.default.createElement("span",{className:"slds-assistive-text"},n||"info"),i,l.default.createElement(a.default,{className:"slds-notify__close slds-button_icon-inverse",iconClassName:"slds-button__icon_large",symbol:"close",assistiveText:"Close",title:"Close"})))};t.Toast=o,t.default=l.default.createElement("div",{className:"demo-only",style:{height:"4rem"}},l.default.createElement(o,{type:"info",containerClassName:"slds-is-relative"},l.default.createElement(n.UtilityIcon,{containerClassName:"slds-m-right_small slds-no-flex slds-align-top",className:"slds-icon_small",assistiveText:!1,symbol:"info"}),l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small"},"26 potential duplicate leads were found."," ",l.default.createElement("a",{href:"javascript:void(0);"},"Select Leads to Merge")))));t.states=[{id:"success",label:"Success",element:l.default.createElement("div",{className:"demo-only",style:{height:"4rem"}},l.default.createElement(o,{type:"success",containerClassName:"slds-is-relative"},l.default.createElement(n.UtilityIcon,{containerClassName:"slds-m-right_small slds-no-flex slds-align-top",className:"slds-icon_small",assistiveText:!1,symbol:"success"}),l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small "},"Account ",l.default.createElement("a",{href:"javascript:void(0);"},"ACME - 100")," widgets was created."))))},{id:"warning",label:"Warning",element:l.default.createElement("div",{className:"demo-only",style:{height:"4rem"}},l.default.createElement(o,{type:"warning",containerClassName:"slds-is-relative"},l.default.createElement(n.UtilityIcon,{containerClassName:"slds-m-right_small slds-no-flex slds-align-top",className:"slds-icon_small",assistiveText:!1,symbol:"warning"}),l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small "},"Can’t share file “report-q3.pdf” with the selected users."))))},{id:"error",label:"Error",element:l.default.createElement("div",{className:"demo-only",style:{height:"4rem"}},l.default.createElement(o,{type:"error",containerClassName:"slds-is-relative"},l.default.createElement(n.UtilityIcon,{containerClassName:"slds-m-right_small slds-no-flex slds-align-top",className:"slds-icon_small",assistiveText:!1,symbol:"error"}),l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small "},"Can’t save lead “Sally Wong” because another lead has the same name."))))},{id:"error-with-details",label:"Error With Details",element:l.default.createElement("div",{className:"demo-only",style:{height:"4rem"}},l.default.createElement(o,{type:"error",containerClassName:"slds-is-relative"},l.default.createElement(n.UtilityIcon,{containerClassName:"slds-m-right_small slds-no-flex slds-align-top",className:"slds-icon_small",assistiveText:!1,symbol:"error"}),l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small"},"You've encountered some errors when trying to save edits to Samuel Smith."),l.default.createElement("p",null,"Here's some detail of what happened, being very descriptive and transparent."))))}],t.examples=[{id:"small",label:"Small Column",element:l.default.createElement("div",{className:"demo-only",style:{height:"4rem",width:"25rem"}},l.default.createElement("div",{className:"slds-region_narrow slds-is-relative"},l.default.createElement(o,{type:"info",containerClassName:"slds-is-absolute"},l.default.createElement("div",{className:"slds-notify__content"},l.default.createElement("h2",{className:"slds-text-heading_small"},"26 potential duplicate leads were found.")))))}]}});