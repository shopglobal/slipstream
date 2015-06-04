var React = require( 'react' )

module.exports = React.createClass({
	render: function () {
		return 	<div className="navbar-header" onClick={ this.props.handleClick } >
					<a className="navbar-brand hidden-sx cursor-pointer">
						<img src={ this.props.buttonImage } alt="" id="logo" />
					</a>
				</div>
	}
})