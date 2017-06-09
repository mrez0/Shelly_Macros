<?php

/*
Plugin Name: Shelly
*/


add_action('admin_enqueue_scripts', 'add_my_script');

function add_my_script()
{
	// Register the script like this for a plugin:
	wp_register_script( 'custom-script', plugins_url( '/custom-script.js', __FILE__ ), array( 'jquery' ),false, true );
	wp_enqueue_script( 'custom-script' );

	$title_nonce = wp_create_nonce( 'title_example' );
	wp_localize_script( 'custom-script', 'my_ajax_obj', array(
		'ajax_url' => admin_url( 'admin-ajax.php' ),
		'nonce'    => $title_nonce,
	) );

	// @todo: remove to init function
	if( !session_id() ) {
		session_start();
	}

	if( ! isset( $_SESSION['shelly_macros'] ) ) {
		$_SESSION['shelly_macros']['is_recording'] = false;
		$_SESSION['shelly_macros']['is_running'] = false;
		$_SESSION['shelly_macros']['commands'] = array();
	}
}

add_action('in_admin_footer', 'include_html');

function include_html()
{
	include ( plugin_dir_path( __FILE__ ) . 'custom-html.html');
}

add_action( 'wp_ajax_shelly_macros_check_if_recording_running', 'check_if_recording_running' );

function check_if_recording_running() {
	if( !session_id() ) {
		session_start();
	}
	$recording = false;
	$running = false;

	$recording = $_SESSION['shelly_macros']['is_recording'];
	$running = $_SESSION['shelly_macros']['is_running'];
	if( ! $recording && ! $running ) {
		$_SESSION['shelly_macros']['commands'] = array();
	}

	wp_send_json( array( $recording, $running, 'commands' => $_SESSION['shelly_macros']['commands'] ));
	wp_die(); // All ajax handlers die when finished

}

add_action( 'wp_ajax_shelly_macros_save_commands', 'shelly_macros_save_commands' );

function shelly_macros_save_commands() {
	if( !session_id() ) {
		session_start();
	}
	check_ajax_referer( 'title_example' );

	$commands = json_decode(stripslashes_deep ( $_POST['commands'] ), true );
	//$commands = array_merge( $_SESSION['shelly_macros']['commands'], $commands );
	$recording = json_decode(stripslashes ( $_POST['is_recording'] ), true );
	$recording = filter_var($recording, FILTER_VALIDATE_BOOLEAN);

	if( ! $recording ) {
		update_user_option( get_current_user_id(), 'shelly_macros_commands', $commands );
		$_SESSION['shelly_macros']['is_recording'] = false;
		$_SESSION['shelly_macros']['commands'] = array();
		wp_die();
	}

	$_SESSION['shelly_macros'] = array(
		'is_recording' => $recording,
		//'commands' => $commands
		'commands' => $commands
	);

	wp_die(); // All ajax handlers die when finished
}

add_action( 'wp_ajax_shelly_macros_save_running_commands', 'shelly_macros_save_running_commands' );

function shelly_macros_save_running_commands() {
	if( !session_id() ) {
		session_start();
	}
	check_ajax_referer( 'title_example' );
	$commands = json_decode(stripslashes_deep( $_POST['commands'] ), true );
	$_SESSION['shelly_macros']['commands'] = $commands;
	$running = json_decode(stripslashes( $_POST['is_running'] ), true);
	$_SESSION['shelly_macros']['is_running'] = filter_var($running, FILTER_VALIDATE_BOOLEAN);
	wp_die();
}

add_action( 'wp_ajax_shelly_macros_get_commands', 'shelly_macros_get_commands' );

function shelly_macros_get_commands() {
	if( !session_id() ) {
		session_start();
	}
	check_ajax_referer( 'title_example' );

	if( count( $_SESSION['shelly_macros']['commands'] ) ) {
		wp_send_json( $_SESSION['shelly_macros']['commands'] );
		wp_die(); // All ajax handlers die when finished
	}

	$_SESSION['shelly_macros']['commands'] = get_user_option( 'shelly_macros_commands' );
	wp_send_json( $_SESSION['shelly_macros']['commands'] );
	wp_die(); // All ajax handlers die when finished
}