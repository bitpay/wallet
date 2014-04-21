// browser side implementation

jQuery(document).ready(function($){
	
	// retrieve encrypted json string when loading page
	// define server cipherParams JSONP path
	var encrypted_url = "http://localhost:3000/crypto/encrypted?callback=?";
	
	// JSONP AJAX call to node.js server running on localhost:3000
	$.getJSON(encrypted_url, function(data){

	    // retrieve encrypted json string 
	    var encrypted_json_str = data.encrypted;

	    console.log("encrypted json string: ");
	    console.log(encrypted_json_str);
	    
	    // store masked data into a div tag
	    $("#data_store").text(encrypted_json_str);
	    
	    // for demostration, display masked data explicitly
	    $("#example_heading").text("Masked data");
	    $("#example_data").text(encrypted_json_str);

	}).done(function(){
		$("#decipher").removeAttr("disabled");
	});
	
	
	// decipher button listener
	$("#decipher").click(function(){
		
		// define server passphrase JSONP path
		var passphrase_url = "http://localhost:3000/crypto/passphrase?callback=?";
		
		// JSONP AJAX call to node.js server running on localhost:3000
		$.getJSON(passphrase_url, function(data){

			// retrieve passphrase string
		    var r_pass_base64 = data.passphrase;

		    console.log("passphrase: ");
		    console.log(r_pass_base64);
		    
		    // for demostration, display passphrase explicitly
		    $("#passphrase_heading").text("Passphrase").removeClass("display_none");
		    $("#passphrase_data").text(r_pass_base64).removeClass("display_none");
		    
		    // take out masked data from div tag 
		    var encrypted_json_str = $("#data_store").text();
		    
		    // decrypt data with encrypted json string, passphrase string and custom JsonFormatter
		    var decrypted = CryptoJS.AES.decrypt(encrypted_json_str, r_pass_base64, { format: JsonFormatter });

		    // convert to Utf8 format unmasked data
		    var decrypted_str = CryptoJS.enc.Utf8.stringify(decrypted);

		    console.log("decrypted string: " + decrypted_str);
		    
		    
		    // convert into unmasked data and store in the div tag
		    $("#data_store").text(decrypted_str);
		    
		    // for demostration, display unmasked data explicitly
		    $("#example_heading").text("Unmasked data");
		    $("#example_data").text(decrypted_str);

		}).done(function(){
			$("#decipher").attr("disabled","disabled");
		});
		
	});
	

	// menu bar animation
	$(".menu_item").click(function(){
		$(".menu_item").removeClass("active");
		$(this).addClass("active");
	});
	
});