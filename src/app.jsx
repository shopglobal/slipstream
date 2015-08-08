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
	Sidebar = require( './sidebar' ),
	InlineEdit = require( 'react-inline-edit' )

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

/*var EditTitle = React.createClass( {
	getInitialState: function () {
		return { 
			text: this.props.title,
			editing: false
		}
	},
	render: function () {
		return (
			<div>
				<InlineEdit 
					tagName={ this.props.tagName }
					className={ this.props.className }
					onChange={ this.onChange }
					onEnterKey={ this.onSave }
					onEscKey={ this.props.onCancel }
					text={ this.state.text }
					placeholder={ this.props.title }
					autoFocus={ this.props.autoFocus }
					maxLength={ this.props.maxLength }
					editing={ this.state.editing }
				/>
				<button onClick={ this.enableEditing } className="btn btn-green">
					Edit title
				</button>
			</div>
		)
	},
	enableEditing: function () {
		this.setState( { editing: true } )
	},
	onChange: function ( text ) {
		console.log( text )
		this.setState( { text: text } )
	},
	onCancel: function () {
		this.replaceState( this.getInitialState )
	},
	onSave: function () {
		console.log( this.props.postId + " " + this.state.text )

		$.ajax( {
			url: '/api/content/edit',
			type: 'POST',
			headers: {
				'Authorization': 'Bearer ' + window.localStorage.token
			},
			data: {
				id: this.props.postId,
				changes: {
					title: this.state.text
				}
			},
			success: function () {
				window.location = window.location
			}
		})
	}
})*/

/*app.value( 'EditTitle', EditTitle )*/
app.value( 'SidebarComponent', SidebarComponent )

/*var TitleElement = React.createElement( EditTitle, {
	title: "The original title",
	tagName: "div",
	className: "name-field",
	placeholder: "The original title",
	autoFocus: true,
	maxLength: 300,
	postId: "5581dbfeb44c0b9d1f97008c"
})

React.render( TitleElement, document.querySelector( '.edit-title' ) )*/