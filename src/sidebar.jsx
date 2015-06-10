var React = require( 'react' ),
	LogoButton = require( './logo-button' )

module.exports = React.createClass({
	render: function () {
		var menuOptions = this.props.menuOptions.map( function ( option ) {
			return 	<li>
						<a href={ option.url } >
							<div className="col-xs-1 text-center icon-lg">
								<div className={ option.icon }></div>
							</div>
							<span className="col-xs-offset-2">
								{ option.title }
							</span>	
						</a>
					</li>
		})

		return 	<div id="sidebar-wrapper" className={ 'container ' + this.props.show } >
					<ul className="sidebar-nav">
						<li className="sidebar-brand">
							<LogoButton buttonImage={ this.props.buttonImage } handleClick={ this.props.handleButtonClick } />
							<div className="pull-right">
								<button className="btn btn-white btn-x no-border" onClick={ this.props.handleButtonClick } >
									<img src="images/x@2x.png" alt="Close sidebar"/>
								</button>
							</div>
						</li>
						{ menuOptions }
					</ul>
					<div className="footer">
						<a href={ this.props.menuOptionBottom.url } >
							<div className="col-xs-1 text-center icon-lg">
								<div className={ this.props.menuOptionBottom.icon }></div>
							</div>
							<span className="col-xs-offset-2">
								{ this.props.menuOptionBottom.title }
							</span>	
						</a>
					</div>
				</div>
	}
})