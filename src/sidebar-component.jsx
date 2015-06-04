var React = require( 'react' ),
	LogoButton = require( './logo-button' ),
	Sidebar = require( './sidebar' )

module.exports = React.createClass({
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
		return 	<div>
					<LogoButton buttonImage={ this.props.buttonImage } handleClick={ this.handleClick } />
					<Sidebar show={ this.state.showSidebar ? '' : 'hidden' } buttonImage={ this.props.buttonImageMini } handleButtonClick={ this.handleClick } menuOptions={ this.props.menuOptions } menuOptionBottom={ this.props.menuOptionBottom } />
				</div>
	}
})