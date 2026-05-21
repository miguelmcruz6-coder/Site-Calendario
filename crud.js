import { database } from "./firebaseConfig.js";

import {
    ref,
    push,
    set,
    onValue,
    remove,
    update
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";


export async function createCashflow(userId, name) {

    const cashflowRef = push(
        ref(database, `users/${userId}/cashflows`)
    );

    await set(cashflowRef, {
        name: name
    });
}


export function listenCashflows(userId, callback) {

    const cashflowsRef = ref(
        database,
        `users/${userId}/cashflows`
    );

    onValue(cashflowsRef, (snapshot) => {

        callback(snapshot.val() || {});
    });
}


export async function createTransaction(
    userId,
    cashflowId,
    transaction
) {

    const transactionRef = push(
        ref(
            database,
            `users/${userId}/cashflows/${cashflowId}/transactions`
        )
    );

    await set(transactionRef, transaction);
}


export function listenTransactions(
    userId,
    cashflowId,
    callback
) {

    const transactionsRef = ref(
        database,
        `users/${userId}/cashflows/${cashflowId}/transactions`
    );

    onValue(transactionsRef, (snapshot) => {

        callback(snapshot.val() || {});
    });
}


export async function updateTransaction(
    userId,
    cashflowId,
    transactionId,
    data
) {

    await update(
        ref(
            database,
            `users/${userId}/cashflows/${cashflowId}/transactions/${transactionId}`
        ),
        data
    );
}


export async function deleteTransaction(
    userId,
    cashflowId,
    transactionId
) {

    await remove(
        ref(
            database,
            `users/${userId}/cashflows/${cashflowId}/transactions/${transactionId}`
        )
    );
}


export async function deleteCashflow(
  userId,
  cashflowId
){

  await remove(
    ref(
      database,
      `users/${userId}/cashflows/${cashflowId}`
    )
  );
}


export function calculateFinancialData(transactions) {

    const list = Object.entries(transactions);

    let income = 0;
    let expense = 0;

    list.forEach(([id, item]) => {

        const value = Number(item.value);

        if (item.type === "entrada") {
            income += value;
        } else {
            expense += value;
        }
    });

    return {
        income,
        expense,
        balance: income - expense,
        totalTransactions: list.length
    };
}


/*
createCashflow - Cria uma nova aba de fluxo de caixa para um usuário específico.
listenCashflows - Escuta as mudanças nas abas de fluxo de caixa de um usuário e executa um callback com os dados atualizados.
createTransaction - Cria uma nova transação em uma aba de fluxo de caixa específica.
listenTransactions - Escuta as mudanças nas transações de uma aba de fluxo de caixa e executa um callback com os dados atualizados.
updateTransaction - Atualiza os dados de uma transação específica.
deleteTransaction - Exclui uma transação específica.
deleteCashflow - Exclui uma aba de fluxo de caixa específica.
calculateFinancialData - Calcula os totais de entrada, saída, saldo e número total de transações a partir dos dados das transações.
*/