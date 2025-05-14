const Importacao = require("../../models/Importacao");
const Prestador = require("../../models/Prestador");
const Usuario = require("../../models/Usuario");
const Lista = require("../../models/Lista");
const { parse } = require("date-fns");
const { arrayToExcelBuffer, excelToJson } = require("../../utils/excel.js");
const { LISTA_PAISES_OMIE } = require("../../utils/omie.js");

const criarNovoManager = async ({ manager }) => {
  const managers = await Lista.findOne({ codigo: "manager" });
  const managerExistente = managers.valores.some(
    (e) => e?.valor?.trim() === manager?.trim()
  );

  if (!managerExistente) {
    managers.valores.push({ valor: manager?.trim() });
    await managers.save();
  }
};

const converterLinhaEmPrestador = async ({ row }) => {
  const pais = LISTA_PAISES_OMIE.find(
    (e) => e.cDescricao.toLowerCase() === row[15]?.toLowerCase()
  );

  const formatDataNascimento = () => {
    const data = row[16];

    if (data === "") return null;

    if (typeof data === "string") {
      return parse(data.replace(/[^\w\/]/g, ""), "dd/MM/yyyy", new Date());
    }

    return data;
  };

  const prestador = {
    manager: row[0],
    nome: row[1],
    tipo: row[2],
    documento: row[3],
    dadosBancarios: {
      banco: row[4],
      agencia: row[5],
      conta: row[6],
      tipoConta: row[7]?.toLowerCase(),
    },
    email: row[8] === "" ? null : row[8],
    endereco: {
      cep: row[9]?.replaceAll("-", ""),
      rua: row[10],
      numero: row[11],
      complemento: row[12],
      cidade: row[13],
      estado: row[14],
      pais: { nome: pais?.cDescricao, cod: pais?.cCodigo },
    },
    pessoaFisica: {
      dataNascimento: formatDataNascimento(),
      pis: row[17],
    },
    pessoaJuridica: { nomeFantasia: row[18] },
  };

  return prestador;
};

const criarNovoPrestador = async ({ prestador }) => {
  const novoPrestador = new Prestador({
    ...prestador,
    status: "ativo",
  });

  await novoPrestador.save();
  return novoPrestador;
};

const buscarPrestadorPorDocumentoEAtualizar = async ({
  documento,
  prestador,
}) => {
  if (!documento || !prestador) return null;
  const prestadorAtualizado = await Prestador.findOneAndUpdate(
    { documento },
    prestador
  );
  return prestadorAtualizado;
};

const criarNovoUsuario = async ({ nome, email }) => {
  const usuario = await Usuario.findOne({ email });

  if (!usuario) {
    const novoUsuario = new Usuario({
      email: email,
      nome: nome,
      tipo: "prestador",
      senha: "123456",
    });

    return await novoUsuario.save();
  }

  return usuario;
};

const processarJsonPrestadores = async ({ json }) => {
  const detalhes = {
    totalDeLinhasLidas: json.length - 1,
    linhasLidasComErro: 0,
    novosPrestadores: 0,
    novosServicos: 0,
    errors: "",
  };

  const arquivoDeErro = [];

  for (const [i, row] of json.entries()) {
    try {
      if (i === 0) {
        arquivoDeErro.push(row);
        continue;
      }
      const prestadorObj = await converterLinhaEmPrestador({ row });

      let prestador = await buscarPrestadorPorDocumentoEAtualizar({
        documento: prestadorObj?.documento,
        prestador: prestadorObj,
      });

      await criarNovoManager({ manager: prestadorObj?.manager });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          prestador: prestadorObj,
        });

        detalhes.novosPrestadores += 1;
      }

      if (prestador.email && !prestador.usuario) {
        const usuario = await criarNovoUsuario({
          email: prestador?.email,
          nome: prestador?.nome,
        });

        prestador.usuario = usuario._id;
        await prestador.save();
      }
    } catch (error) {
      arquivoDeErro.push(row);
      detalhes.linhasLidasComErro += 1;
      detalhes.errors += `❌ [ERROR AO PROCESSAR LINHA]: ${i + 1} [PRESTADOR: ${row[2]}] - \nDETALHES DO ERRO: ${error}\n\n`;
    }
  }

  return { detalhes, arquivoDeErro };
};

exports.importarPrestador = async (req, res) => {
  try {
    const arquivo = req.files[0];

    const importacao = new Importacao({
      tipo: "prestador",
      arquivoOriginal: { ...arquivo, nome: arquivo.originalname },
    });

    await importacao.save();

    if (arquivo && importacao) res.status(200).json(importacao);

    const json = excelToJson({ arquivo });

    const { detalhes, arquivoDeErro } = await processarJsonPrestadores({
      json,
    });

    importacao.arquivoErro = arrayToExcelBuffer({ array: arquivoDeErro });
    importacao.arquivoLog = Buffer.from(detalhes.errors);
    importacao.detalhes = detalhes;

    await importacao.save();
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Ouve um erro ao importar arquivo" });
  }
};
