import { config } from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 } from "uuid";

config();

const s3 = new S3Client({
	region: "eu-west-2",
});

const getUploadURL = async (key, contentType) => {
	const params = {
		Bucket: process.env.S3_BUCKET_NAME,
		Key: key,
		ContentType: contentType,
		ACL: "public-read",
	};

	const command = new PutObjectCommand(params);
	const url = await getSignedUrl(s3, command, { expiresIn: 60 });

	return url;
};

export const uploadProfilePicture = async function (
	fileType,
	fileExtension,
	studentId
) {
	const key = `profile/profile-pic-${v4()}.${fileExtension}`;

	const url = await getUploadURL(key, `${fileType}/${fileExtension}`);

	return { url, key };
};
