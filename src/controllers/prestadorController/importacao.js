const Importacao = require("../../models/Importacao.js");
const Prestador = require("../../models/Prestador.js");
const Usuario = require("../../models/Usuario.js");
const Lista = require("../../models/Lista.js");
const { parse } = require("date-fns");
const { arrayToExcelBuffer, excelToJson } = require("../../utils/excel.js");
const { LISTA_PAISES_OMIE } = require("../../utils/omie.js");
const { registrarAcao } = require("../../services/controleService");
const {
  ACOES,
  ENTIDADES,
  ORIGENS,
} = require("../../constants/controleAlteracao");

const criarNovoManager = async ({ manager, usuario }) => {
  const managers = await Lista.findOne({ codigo: "manager" });
  const managerExistente = managers.valores.some(
    (e) => e?.valor?.trim() === manager?.trim()
  );

  if (!managerExistente) {
    managers.valores.push({ valor: manager?.trim() });
    await managers.save();

    registrarAcao({
      acao: ACOES.ADICIONADO,
      entidade: ENTIDADES.CONFIGURACAO_LISTA_MANAGER,
      origem: ORIGENS.IMPORTACAO,
      dadosAtualizados: managers,
      idRegistroAlterado: managers._id,
      usuario: usuario,
    });
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

const criarNovoPrestador = async ({ prestador, usuario }) => {
  if (prestador?.email) {
    const prestadorExistente = await Prestador.findOne({
      email: prestador?.email,
    });

    if (prestadorExistente) {
      throw new Error(
        `Prestador com o mesmo email já cadastrado: ${prestador?.email}`
      );
    }
  }

  const novoPrestador = new Prestador({
    ...prestador,
    status: "ativo",
  });

  registrarAcao({
    acao: ACOES.ADICIONADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: novoPrestador,
    idRegistroAlterado: novoPrestador._id,
    usuario: usuario,
  });

  await novoPrestador.save();
  return novoPrestador;
};

const buscarPrestadorPorDocumentoEAtualizar = async ({
  documento,
  prestador,
  usuario,
}) => {
  if (!documento || !prestador) return null;

  const prestadorExistente = await Prestador.findOne({ documento });
  if (!prestadorExistente) return null;

  if (prestador?.email) {
    const prestadorPorEmail = await Prestador.findOne({
      email: prestador?.email,
    });

    if (
      prestadorPorEmail &&
      prestadorPorEmail?._id?.toString() !== prestadorExistente._id.toString()
    ) {
      throw new Error(
        `Prestador com o mesmo email já cadastrado: ${prestador?.email}`
      );
    }

    if (prestadorExistente?.usuario) {
      const usuario = await Usuario.findOne({ email: prestador?.email });

      if (usuario) {
        if (
          usuario?._id?.toString() !== prestadorExistente.usuario.toString()
        ) {
          throw new Error(
            `Usuário prestador com o mesmo email já cadastrado: ${prestador?.email}`
          );
        }

        usuario.email = prestador?.email;
        await usuario.save();
      }
    }
  }

  const prestadorAtualizado = await Prestador.findOneAndUpdate(
    { documento },
    prestador
  );

  registrarAcao({
    acao: ACOES.ALTERADO,
    entidade: ENTIDADES.PRESTADOR,
    origem: ORIGENS.IMPORTACAO,
    dadosAtualizados: prestadorAtualizado,
    idRegistroAlterado: prestadorAtualizado._id,
    usuario: usuario,
  });

  return prestadorAtualizado;
};

const processarJsonPrestadores = async ({ json, usuario }) => {
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
        usuario,
      });

      await criarNovoManager({ manager: prestadorObj?.manager, usuario });

      if (!prestador) {
        prestador = await criarNovoPrestador({
          prestador: prestadorObj,
          usuario,
        });

        detalhes.novosPrestadores += 1;
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
      usuario: req.usuario,
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
