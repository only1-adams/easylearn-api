import { config } from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 } from "uuid";

config();

const s3 = new S3Client({
	region: "us-east-1",
});

const getUploadURL = async (key, contentType) => {
	const params = {
		Bucket: "myklefblog-bucket",
		Key: key,
		ContentType: contentType,
		ACL: "public-read",
	};

	const command = new PutObjectCommand(params);
	const url = await getSignedUrl(s3, command, { expiresIn: 60 });

	return url;
};

export const uploadInfluencerPic = async function (
	fileType,
	fileExtension,
	userId
) {
	const key = `influencers/${userId}/profile-pic.${fileExtension}`;

	const url = await getUploadURL(key, `${fileType}/${fileExtension}`);

	return { url, key };
};

export const uploadBrandPic = async function (
	fileType,
	fileExtension,
	user,
	brandId
) {
	const key = `brands/${user.userId}/${brandId}/profile-pic.${fileExtension}`;

	const url = await getUploadURL(key, `${fileType}/${fileExtension}`);

	return { url, key };
};

export const uploadConversationMedia = async (
	fileType,
	fileExtension,
	conversationId
) => {
	const key = `conversations/${conversationId}/${v4()}-media.${fileExtension}`;

	const url = await getUploadURL(key, `${fileType}/${fileExtension}`);

	return { url, key };
};
