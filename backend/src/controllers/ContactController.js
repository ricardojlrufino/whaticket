const Sequelize = require("sequelize");

const Contact = require("../models/Contact");
const ContactCustomField = require("../models/ContactCustomField");

// const Message = require("../models/Message");
// const Sequelize = require("sequelize");
const { getIO } = require("../libs/socket");
// const { getWbot } = require("../libs/wbot");

exports.index = async (req, res) => {
	const { searchParam = "", pageNumber = 1, rowsPerPage = 10 } = req.query;

	const whereCondition = {
		name: Sequelize.where(
			Sequelize.fn("LOWER", Sequelize.col("name")),
			"LIKE",
			"%" + searchParam.toLowerCase() + "%"
		),
	};

	let limit = +rowsPerPage;
	let offset = limit * (pageNumber - 1);

	//todo >> add contact number to search where condition

	const { count, rows: contacts } = await Contact.findAndCountAll({
		where: whereCondition,
		limit,
		offset,
		order: [["createdAt", "DESC"]],
	});

	return res.json({ contacts, count });
};

exports.store = async (req, res) => {
	// const wbot = getWbot();
	const io = getIO();
	// const { number, name } = req.body;

	// const result = await wbot.isRegisteredUser(`55${number}@c.us`);

	// if (!result) {
	// 	return res
	// 		.status(400)
	// 		.json({ error: "The suplied number is not a valid Whatsapp number" });
	// }
	// const profilePicUrl = await wbot.getProfilePicUrl(`55${number}@c.us`);

	const contact = await Contact.create(req.body);

	io.emit("contact", {
		action: "create",
		contact: contact,
	});

	res.status(200).json(contact);
};

exports.show = async (req, res) => {
	const { contactId } = req.params;

	const { id, name, number, email, extraInfo } = await Contact.findByPk(
		contactId,
		{
			include: [{ model: ContactCustomField, as: "extraInfo" }],
		}
	);

	res.status(200).json({
		id,
		name,
		number,
		email,
		extraInfo,
	});
};

exports.update = async (req, res) => {
	const io = getIO();

	const { contactId } = req.params;

	const contact = await Contact.findByPk(contactId);

	if (!contact) {
		return res.status(400).json({ error: "No contact found with this ID" });
	}

	await contact.update(req.body);

	io.emit("contact", {
		action: "update",
		contact: contact,
	});

	res.status(200).json(contact);
};

exports.delete = async (req, res) => {
	const io = getIO();
	const { contactId } = req.params;

	const contact = await Contact.findByPk(contactId);

	if (!contact) {
		return res.status(400).json({ error: "No contact found with this ID" });
	}

	await contact.destroy();

	io.emit("contact", {
		action: "delete",
		contactId: contactId,
	});

	res.status(200).json({ message: "Contact deleted" });
};