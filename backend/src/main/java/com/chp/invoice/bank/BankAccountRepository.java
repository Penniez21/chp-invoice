package com.chp.invoice.bank;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    List<BankAccount> findAllByOrderBySortOrderAscIdAsc();

    List<BankAccount> findByShowOnInvoiceTrueOrderBySortOrderAscIdAsc();

    long countByShowOnInvoiceTrue();
}
