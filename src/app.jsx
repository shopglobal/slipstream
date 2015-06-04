var React = require( 'react' ),
	SidebarComponent = require( './sidebar-component' )

var sidebar = React.createElement( SidebarComponent, {
	buttonImage: "images/ss_logo.png",
	buttonImageMini: "images/ss_green.png",
	menuOptionBottom: { title: 'Logout', url: '#/home/splash', icon: "glyphicon glyphicon-log-out" },
	menuOptions: [
		{ url: "#/app/profile", title: "Profile", icon: "glyphicon glyphicon-user" }
	]
} )

window.onload = function () {
	React.render( sidebar, document.querySelector( 'sidebar-button' ) )
}