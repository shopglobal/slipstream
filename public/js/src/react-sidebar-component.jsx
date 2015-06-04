/*Hello*/

var LogoButton = React.createClass({
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

var Sidebar = React.createClass({
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

		return 	<div id="sidebar-wrapper" className={ 'col-xs-12 container ' + this.props.show } >
					<ul className="sidebar-nav">
						<li className="sidebar-brand">
							<LogoButton buttonImage={ this.props.buttonImage } handleClick={ this.props.handleButtonClick } buttonImageMini={ this.props.buttonImageMini } />
							<div className="pull-right">
								<button className="btn btn-white btn-x no-border" onClick={ this.props.handleButtonClick } >
									<img src="images/x@2x.png" alt="Close sidebar"/>
								</button>
							</div>
						</li>
						{ menuOptions }
					</ul>
					<div className="footer">
						<a onClick={ this.props.handleSignOut } >
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