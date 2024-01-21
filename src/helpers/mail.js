export const generateActivationEmail = (code) => {
	return `<!DOCTYPE html>
<html>
	<head>
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
		<title>Easylearn</title>
		<style>
			@media only screen and (max-width: 620px) {
				table.body h1 {
					font-size: 28px !important;
					margin-bottom: 10px !important;
				}

				table.body p,
				table.body ul,
				table.body ol,
				table.body td,
				table.body span,
				table.body a {
					font-size: 16px !important;
				}

				table.body .wrapper,
				table.body .article {
					padding: 10px !important;
				}

				table.body .content {
					padding: 0 !important;
				}

				table.body .container {
					padding: 0 !important;
					width: 100% !important;
				}

				table.body .main {
					border-left-width: 0 !important;
					border-radius: 0 !important;
					border-right-width: 0 !important;
				}

				table.body .btn table {
					width: 100% !important;
				}

				table.body .btn a {
					width: 100% !important;
				}

				table.body .img-responsive {
					height: auto !important;
					max-width: 100% !important;
					width: auto !important;
				}
			}
			@media all {
				.ExternalClass {
					width: 100%;
				}

				.ExternalClass,
				.ExternalClass p,
				.ExternalClass span,
				.ExternalClass font,
				.ExternalClass td,
				.ExternalClass div {
					line-height: 100%;
				}

				.apple-link a {
					color: inherit !important;
					font-family: inherit !important;
					font-size: inherit !important;
					font-weight: inherit !important;
					line-height: inherit !important;
					text-decoration: none !important;
				}

				#MessageViewBody a {
					color: inherit;
					text-decoration: none;
					font-size: inherit;
					font-family: inherit;
					font-weight: inherit;
					line-height: inherit;
				}

				.btn-primary table td:hover {
					background-color: #34495e !important;
				}

				.btn-primary a:hover {
					background-color: #34495e !important;
					border-color: #34495e !important;
				}
			}
		</style>
	</head>
	<body
		style="
			background-color: #f6f6f6;
			font-family: sans-serif;
			-webkit-font-smoothing: antialiased;
			font-size: 14px;
			line-height: 1.4;
			margin: 0;
			padding: 0;
			-ms-text-size-adjust: 100%;
			-webkit-text-size-adjust: 100%;
		"
	>
		<span
			class="preheader"
			style="
				color: transparent;
				display: none;
				height: 0;
				max-height: 0;
				max-width: 0;
				opacity: 0;
				overflow: hidden;
				mso-hide: all;
				visibility: hidden;
				width: 0;
			"
			>This is preheader text. Some clients will show this text as a
			preview.</span
		>
		<table
			role="presentation"
			border="0"
			cellpadding="0"
			cellspacing="0"
			class="body"
			style="
				border-collapse: separate;
				mso-table-lspace: 0pt;
				mso-table-rspace: 0pt;
				background-color: #f6f6f6;
				width: 100%;
			"
			width="100%"
			bgcolor="#f6f6f6"
		>
			<tr>
				<td
					style="font-family: sans-serif; font-size: 14px; vertical-align: top"
					valign="top"
				>
					&nbsp;
				</td>
				<td
					class="container"
					style="
						font-family: sans-serif;
						font-size: 14px;
						vertical-align: top;
						display: block;
						max-width: 580px;
						padding: 10px;
						width: 580px;
						margin: 0 auto;
					"
					width="580"
					valign="top"
				>
					<div
						class="content"
						style="
							box-sizing: border-box;
							display: block;
							margin: 0 auto;
							max-width: 580px;
							padding: 10px;
						"
					>
						<!-- START CENTERED WHITE CONTAINER -->
						<table
							role="presentation"
							class="main"
							style="
								border-collapse: separate;
								mso-table-lspace: 0pt;
								mso-table-rspace: 0pt;
								background: #ffffff;
								border-radius: 3px;
								width: 100%;
							"
							width="100%"
						>
							<!-- START MAIN CONTENT AREA -->
							<tr>
								<td
									class="wrapper"
									style="
										font-family: sans-serif;
										font-size: 14px;
										vertical-align: top;
										box-sizing: border-box;
										padding: 20px;
									"
									valign="top"
								>
									<table
										role="presentation"
										border="0"
										cellpadding="0"
										cellspacing="0"
										style="
											border-collapse: separate;
											mso-table-lspace: 0pt;
											mso-table-rspace: 0pt;
											width: 100%;
										"
										width="100%"
									>
										<tr>
											<td
												style="
													font-family: sans-serif;
													font-size: 14px;
													vertical-align: top;
												"
												valign="top"
												align="center"
											>
												<a href="https://atslabs.com">
													<img
														src="https://myklefblog-bucket.s3.amazonaws.com/easylearn.png"
														height="40"
														alt="Easylearn"
													/>
												</a>
											</td>
										</tr>
										<tr>
											<td
												style="
													font-family: sans-serif;
													font-size: 14px;
													vertical-align: top;
												"
												valign="top"
											>
												<!-- Content goes here -->
												<table style="padding-top: 20px">
													<tr>
														<td
															style="
																font-family: sans-serif;
																font-size: 24px;
																vertical-align: top;
																font-weight: bold;
																color: #494ae2;
															"
															valign="top"
															align="center"
														>
															Account Activation
														</td>
													</tr>
													<tr>
														<td
															style="
																font-family: sans-serif;
																font-size: 14px;
																vertical-align: top;
																font-weight: medium;
															"
															valign="top"
															align="center"
														>
															<span style="margin-bottom: 20px; display: block">
																You're almost there! Use the code below to
																activate your account. Note that you will not be
																able to access any class until you have
																activated it.
															</span>
														</td>
													</tr>
													<tr>
														<td
															style="
																font-family: sans-serif;
																font-size: 25px;
																vertical-align: top;
																font-weight: 800;
																letter-spacing: 10px;
															"
															valign="top"
															align="center"
														>
															<span style="margin-bottom: 20px; display: block"
																>${code}</span
															>
														</td>
													</tr>
													<tr>
														<td
															style="
																font-family: sans-serif;
																font-size: 14px;
																vertical-align: top;
																font-weight: 400;
															"
															valign="top"
															align="center"
														>
															This email message was automatically sent by
															<a href="https://easylearn.com"
																>https://easylearn.com</a
															>
															because someone attempted to create an account on
															Easylearn using this email address.
														</td>
													</tr>
												</table>
											</td>
										</tr>
									</table>
								</td>
							</tr>
							<!-- END MAIN CONTENT AREA -->
						</table>
						<!-- END CENTERED WHITE CONTAINER -->

						<!-- SPERATOR -->

						<div
							style="
								clear: both;
								margin-top: 10px;
								text-align: center;
								width: 100%;
							"
						>
							<table
								role="presentation"
								border="0"
								cellpadding="0"
								cellspacing="0"
								style="
									border-collapse: separate;
									mso-table-lspace: 0pt;
									mso-table-rspace: 0pt;
									width: 100%;
								"
								width="100%"
							>
								<tr>
									<td>
										<hr />
									</td>
								</tr>
							</table>
						</div>

						<!-- START FOOTER -->
						<div
							class="footer"
							style="
								clear: both;
								margin-top: 10px;
								text-align: center;
								width: 100%;
								background: #ffffff;
							"
						>
							<table
								role="presentation"
								border="0"
								cellpadding="0"
								cellspacing="0"
								style="
									border-collapse: separate;
									mso-table-lspace: 0pt;
									mso-table-rspace: 0pt;
									width: 100%;
								"
								width="100%"
							>
								<tr>
									<td
										class="content-block"
										style="
											font-family: sans-serif;
											vertical-align: top;
											padding-bottom: 10px;
											padding-top: 10px;
											color: #999999;
											font-size: 12px;
											text-align: center;
										"
										valign="top"
										align="center"
									>
										<span
											class="apple-link"
											style="
												color: #676666;
												font-size: 12px;
												text-align: center;
											"
										>
											&copy; 2024 Easylearn, All rights reserved.</span
										>
									</td>
								</tr>
							</table>
						</div>
						<!-- END FOOTER -->
					</div>
				</td>
				<td
					style="font-family: sans-serif; font-size: 14px; vertical-align: top"
					valign="top"
				>
					&nbsp;
				</td>
			</tr>
		</table>
	</body>
</html>`;
};
