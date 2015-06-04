/*Hello*/

var LogoButton = React.createClass({displayName: "LogoButton",
	render: function () {
		return 	React.createElement("div", {className: "navbar-header", onClick:  this.props.handleClick}, 
					React.createElement("a", {className: "navbar-brand hidden-xs cursor-pointer"}, 
						React.createElement("img", {src:  this.props.buttonImage, alt: "", id: "logo"})
					), 
					React.createElement("a", {className: "navbar-brand visible-xs cursor-pointer"}, 
						React.createElement("img", {src:  this.props.buttonImageMini, alt: "", id: "logo"})
					)
				)
	}
})

var SidebarComponent = React.createClass({displayName: "SidebarComponent",
	handleClick: function () {
		this.setState({
			showSidebar: !this.state.showSidebar
		})
	},
	getInitialState: function () {
	    return {
	    	showSidebar: false    
	    }
	},
	render: function () {
		return 	React.createElement("div", null, 
					React.createElement(LogoButton, {buttonImage:  this.props.buttonImage, handleClick:  this.handleClick}), 
					React.createElement(Sidebar, {show:  this.state.showSidebar ? '' : 'sidebar-hidden', buttonImage:  this.props.buttonImageMini, handleButtonClick:  this.handleClick, menuOptions:  this.props.menuOptions, menuOptionBottom:  this.props.menuOptionBottom})
				)
	}
})

var Sidebar = React.createClass({displayName: "Sidebar",
	render: function () {
		var menuOptions = this.props.menuOptions.map( function ( option ) {
			return 	React.createElement("li", null, 
						React.createElement("a", {href:  option.url}, 
							React.createElement("div", {className: "col-xs-1 text-center icon-lg"}, 
								React.createElement("div", {className:  option.icon})
							), 
							React.createElement("span", {className: "col-xs-offset-2"}, 
								 option.title
							)	
						)
					)
		})

		return 	React.createElement("div", {id: "sidebar-wrapper", className:  'container ' + this.props.show}, 
					React.createElement("ul", {className: "sidebar-nav"}, 
						React.createElement("li", {className: "sidebar-brand"}, 
							React.createElement(LogoButton, {buttonImage:  this.props.buttonImage, handleClick:  this.props.handleButtonClick}), 
							React.createElement("div", {className: "pull-right"}, 
								React.createElement("button", {className: "btn btn-white btn-x no-border", onClick:  this.props.handleButtonClick}, 
									React.createElement("img", {src: "images/x@2x.png", alt: "Close sidebar"})
								)
							)
						), 
						 menuOptions 
					), 
					React.createElement("div", {className: "footer"}, 
						React.createElement("a", {href:  this.props.menuOptionBottom.url}, 
							React.createElement("div", {className: "col-xs-1 text-center icon-lg"}, 
								React.createElement("div", {className:  this.props.menuOptionBottom.icon})
							), 
							React.createElement("span", {className: "col-xs-offset-2"}, 
								 this.props.menuOptionBottom.title
							)	
						)
					)
				)
	}
})