/*var React = require( 'react' ),
	SidebarComponent = require( './sidebar-component' )*/

/*var sidebar = React.createElement( SidebarComponent, {
	buttonImage: "images/ss_logo.png",
	buttonImageMini: "images/ss_green.png",
	menuOptionBottom: { title: 'Logout', url: '#/home/splash', icon: "glyphicon glyphicon-log-out" },
	menuOptions: [
		{ url: "#/app/profile", title: "Profile", icon: "glyphicon glyphicon-user" }
	]
} )*/

var React = require( 'react' ),
	LogoButton = require( './logo-button' ),
	Sidebar = require( './sidebar' )

var SidebarComponent = React.createClass({
	handleClick: function () {
		this.setState({
			showSidebar: !this.state.showSidebar
		})
	},
	handleSignOut: function () {
		localStorage.removeItem( 'token' )
		localStorage.removeItem( 'username' )
		localStorage.removeItem( 'role' )
		this.handleClick()
		return window.location.assign( '#/home/splash' )
	},
	getInitialState: function () {
	    return {
	    	showSidebar: false    
	    }
	},
	render: function () {
		return 	<div>
					<LogoButton buttonImage={ this.props.buttonImage } buttonImageMini={ this.props.buttonImageMini } handleClick={ this.handleClick } />
					<Sidebar show={ this.state.showSidebar ? '' : 'sidebar-hidden' } buttonImage={ this.props.buttonImageMini } buttonImageMini={ this.props.buttonImageMini } handleButtonClick={ this.handleClick } menuOptions={ this.props.menuOptions } menuOptionBottom={ this.props.menuOptionBottom } handleSignOut={ this.handleSignOut } />
				</div>
	}
})

app.value( 'SidebarComponent', SidebarComponent )