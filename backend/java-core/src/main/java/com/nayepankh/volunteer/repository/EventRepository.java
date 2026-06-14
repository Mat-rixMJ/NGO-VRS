package com.nayepankh.volunteer.repository;

import com.nayepankh.volunteer.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByStatusOrderByEventDateDesc(String status);
    List<Event> findByCityOrderByEventDateDesc(String city);
    List<Event> findAllByOrderByEventDateDesc();
}
