const nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;

const oauth2Client = new OAuth2(
	"881440724380-aa3j4iahbe42jhqraiu9d2a7v19v1ko6.apps.googleusercontent.com", // ClientID
	"Q7VFO6qSZMlNzC_3bgGzXXpm", // Client Secret
	"https://developers.google.com/oauthplayground" // Redirect URL
);

oauth2Client.setCredentials({
	refresh_token: "1//04Wyz9j66DdZACgYIARAAGAQSNwF-L9Irv3q0tBftBOljq_2RUNe2yly1cUUWynn9c641FuU_xKJuvu_tIaaZHI63XngcJQXxvjc"
});
const accessToken = oauth2Client.getAccessToken();
const smtpTransport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		 type: "OAuth2",
		 user: "foodfinder122019@gmail.com", 
		 clientId: "881440724380-aa3j4iahbe42jhqraiu9d2a7v19v1ko6.apps.googleusercontent.com",
		 clientSecret: "Q7VFO6qSZMlNzC_3bgGzXXpm",
		 refreshToken: "1//04eVDBS7Ms45tCgYIARAAGAQSNwF-L9Ir0xIHFvV7PbK9ZWSJThog9TH4NoEt-ruhUL4jJGbrTQTXMn5zTnS7t5H91VNuAki0wJY",
		 accessToken: accessToken
	}
});

const mailOptions = {
    from: "foodfinder122019@gmail.com",
    to: "limaijing@gmail.com",
    subject: "Node.js Email with Secure OAuth",
    generateTextFromHTML: true,
    html: "<b>test</b>"
};

smtpTransport.sendMail(mailOptions, (error, response) => {
    error ? console.log(error) : console.log(response);
    smtpTransport.close();
});