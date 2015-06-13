var React = require( 'react' )

module.exports = React.createClass({
	render: function () {
		return 	<div className="" onClick={ this.props.handleClick } >
					<a className="navbar-brand hidden-xs cursor-pointer">
						<img src={ this.props.buttonImage } alt="" id="logo" />
					</a>
					<a className="navbar-brand visible-xs cursor-pointer">
						<img src={ this.props.buttonImageMini } alt="" id="logo" />
					</a> 
				</div>
	}
})