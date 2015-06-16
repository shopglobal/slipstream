var React = require( 'react' ),
	LogoButton = require( './logo-button' ),
	Sidebar = require( './sidebar' )

module.exports = React.createClass({
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