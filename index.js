const cors = require('cors');
const logger = require('morgan');
const express = require('express');
require('dotenv').config();
const app = express();
const { uploadFile, getFileStream } = require('./s3');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

const { relations } = require('./models');
const { Op } = require('sequelize');
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Expose-Headers', '*');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const getFamilyOrg = async () => {
  let _rootrels = await relations.findOne({
    where: { isRoot: 1, gender: 'male' },
  });

  if (!_rootrels) {
    return {};
  }
  _rootrels = JSON.parse(JSON.stringify(_rootrels));
  let rootmrs = await relations.findOne({ where: { gender: 'female', id: _rootrels.isPartnerOf } });
  let rootname = `Mr.${_rootrels.fname} ${rootmrs ? '& Mrs.' + rootmrs.fname : ''}`;

  let _rels = await relations.findAll({});
  let rels = [];
  _rels = JSON.parse(JSON.stringify(_rels));

  for (let eachRel of _rels) {
    if (eachRel.isPartnerOf && eachRel.gender === 'male') {
      let mrs = _rels.filter((a) => a.isPartnerOf === eachRel.id)[0];
      let name = `Mr.${eachRel.fname} & Mrs.${mrs.fname}`;
      let children = await relations.findAll({ where: { childOf: eachRel.id } });
      children = JSON.parse(JSON.stringify(children));
      rels.push({
        name,
        childOf: eachRel.childOf,
        id: eachRel.id,
        children: [],
        gender: eachRel.gender,
        isPartnerOf: eachRel.isPartnerOf,
      });
    }

    if (!eachRel.isPartnerOf) {
      let name = eachRel.gender === 'male' ? `Mr.${eachRel.fname}` : `Miss.${eachRel.fname}`;
      rels.push({
        name,
        childOf: eachRel.childOf,
        id: eachRel.id,
        gender: eachRel.gender,
        isPartnerOf: eachRel.isPartnerOf,
      });
      console.log('here', eachRel.fname);
    }
  }

  let rootId = rels[0].id;
  let rootChildscopy = await rels.slice().reverse();
  let rootChilds = await rels.filter((c) => c.childOf === rootId);
  rels[0].children = rootChilds;

  let relsObj = {};
  for (let child_ of rootChildscopy) {
    // let childs_ = await rootChildscopy.filter((a) => a.childOf === child_.id && a.gender === 'male');
    let childs_ = await rootChildscopy.filter((a) => a.childOf === child_.id);
    relsObj[child_.id] = {
      name: child_.name,
      id: child_.id,
      childOf: child_.childOf,
      gender: child_.gender,
      isPartnerOf: child_.isPartnerOf,
      children: childs_.map((r) => relsObj[r.id]),
      childs: childs_.map((r) => r.id),
    };
  }

  return [Object.values(relsObj)[0]];
};

app.get('/family', async (req, res) => {
  res.json({
    success: true,
    family: await getFamilyOrg(),
  });
});

app.post('/newMember', async (req, res) => {
  let { fname, lname, childOf, isPartnerOf, gender, birthdate, isRoot, about, birthPlace } = req.body;

  let newMem = await relations.create({
    fname,
    lname,
    childOf,
    isPartnerOf,
    gender,
    birthdate,
    isRoot,
    about,
    birthPlace,
  });

  if (isPartnerOf) {
    let partner = await relations.findOne({
      where: {
        id: isPartnerOf,
      },
    });

    partner.isPartnerOf = newMem.id;
    await partner.save();
  }
  res.json({
    success: true,
    family: await getFamilyOrg(),
  });
});

app.get('/unMarried/:gender/:childOf', async (req, res) => {
  let { gender, childOf } = req.params;
  let where = {};
  if (childOf && childOf !== 'undefined') where.childOf = childOf;
  if (gender) {
    if (gender === 'male') {
      where.gender = 'female';
    } else {
      where.gender = 'male';
    }
  }

  let singles = await relations.findAll({
    where: {
      isPartnerOf: null,
      ...where,
    },
  });

  res.json({
    success: true,
    singles,
  });
});

app.get('/relations', async (req, res) => {
  let _rels = await relations.findAll({});

  let rels = {};
  _rels = JSON.parse(JSON.stringify(_rels));
  for (let eachRel of _rels) {
    if (eachRel.isPartnerOf && eachRel.gender === 'male') {
      let mrs = _rels.filter((a) => a.isPartnerOf === eachRel.id)[0];
      let name = `Mr.${eachRel.fname} & Mrs.${mrs.fname}`;
      rels[eachRel.id] = name;
    }
  }
  res.json({
    success: true,
    relations: Object.entries(rels),
  });
});

app.get('/details/:id', async (req, res) => {
  let { id } = req.params;
  let _rels = await relations.findOne({ where: { id } });

  _rels = JSON.parse(JSON.stringify(_rels));
  let finalObj = {};
  let mrs = await relations.findOne({ where: { isPartnerOf: _rels.id } });
  if (mrs) {
    mrs = JSON.parse(JSON.stringify(mrs));
    let name = `Mr.${_rels.fname} & Mrs.${mrs.fname}`;
    let mrsDetails = {
      ...mrs,
    };
    let childs = await relations.findAll({
      where: {
        childOf: _rels.id,
      },
    });
    finalObj = { name, mrsDetails, ..._rels, childs };
  } else {
    let name = _rels.gender === 'male' ? `Mr.${_rels.fname}` : `Miss.${_rels.fname}`;
    finalObj = { name, ..._rels, childs: [] };
  }

  res.json({
    success: true,
    details: finalObj,
  });
});

app.delete('/:id', async (req, res) => {
  let { id } = req.params;
  let rel = await relations.findOne({ where: { id } });
  rel = JSON.parse(JSON.stringify(rel));
  if (rel.isRoot) {
    await relations.destroy({
      truncate: true,
    });
  } else {
    await relations.destroy({
      where: {
        [Op.or]: [{ id }, { isPartnerOf: id }, { childOf: id }],
      },
    });
  }
  res.json({
    success: true,
  });
});

app.post('/upload/image/:userId', upload.single('image'), async (req, res) => {
  const file = req.file;
  const result = await uploadFile(file);
  await unlinkFile(file.path);
  if (req.params.userId !== 'new') {
    let partner = await relations.findOne({
      where: {
        id: req.params.userId,
      },
    });
    partner.photourl = `/images/${result.Key}`;
    await partner.save();
  }
  res.send({ success: true, photourl: `/images/${result.Key}` });
});

app.post('/:id', async (req, res) => {
  let { id } = req.params;
  let { fname, lname, childOf, isPartnerOf, gender, birthdate, about, birthPlace } = req.body;

  let partner = await relations.findOne({
    where: {
      id,
    },
  });

  if (fname) partner.fname = fname;
  if (lname) partner.lname = lname;
  if (childOf) partner.childOf = childOf;
  if (isPartnerOf) partner.isPartnerOf = isPartnerOf;
  if (gender) partner.gender = gender;
  if (birthdate) partner.birthdate = birthdate;
  if (about) partner.about = about;
  if (birthPlace) partner.birthPlace = birthPlace;

  await partner.save();

  res.json({
    success: true,
  });
});

app.get('/images/:key', (req, res) => {
  console.log(req.params);
  const key = req.params.key;
  const readStream = getFileStream(key);

  readStream.pipe(res);
});

const port = process.env.PORT || 8000;

app.listen(port, () => {
  console.log(`Server running on port ${port} 🔥`);
});
