export default function generateCreatorEmail(
	universityAcronym,
	faculty,
	department,
	level
) {
	const acronym = universityAcronym.toLowerCase();

	const formattedFaculty = faculty.split(" ").join("").toLowerCase();

	const formattedDepartment = department.split(" ").join("").toLowerCase();

	const creatorEmail = `${acronym}.${formattedFaculty}.${formattedDepartment}.${level}@easylearn.com`;

	return creatorEmail;
}
