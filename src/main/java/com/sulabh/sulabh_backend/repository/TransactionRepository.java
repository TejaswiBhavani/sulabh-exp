package com.sulabh.sulabh_backend.repository;

import com.sulabh.sulabh_backend.entity.Transaction;
import com.sulabh.sulabh_backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserOrderByCreatedAtDesc(User user);
    Optional<Transaction> findByTransactionId(String transactionId);
    List<Transaction> findByUserAndStatusOrderByCreatedAtDesc(User user, String status);
    List<Transaction> findByUserEmailOrderByCreatedAtDesc(String userEmail);
}
